import os
from datetime import timedelta
from typing import Dict, List, Any, Optional
from flask import Flask, jsonify, request, Response
from models import init_db, db, Dog, Breed, Reminder
from utils.time_utils import utcnow, parse_iso_datetime

DUE_SOON_WINDOW_HOURS = 24
VALID_REMINDER_STATUS_FILTERS = ('upcoming', 'overdue', 'completed')

# Get the server directory path
base_dir: str = os.path.abspath(os.path.dirname(__file__))

app: Flask = Flask(__name__)
db_path: str = os.environ.get('DATABASE_PATH', os.path.join(base_dir, 'dogshelter.db'))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database with the app
init_db(app)

@app.route('/api/dogs', methods=['GET'])
def get_dogs() -> Response:
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 6, type=int)
    page = max(1, page)
    per_page = max(1, min(per_page, 100))

    query = db.session.query(
        Dog.id, 
        Dog.name, 
        Breed.name.label('breed')
    ).join(Breed, Dog.breed_id == Breed.id)
    
    total = query.count()
    dogs_query = query.offset((page - 1) * per_page).limit(per_page).all()
    
    dogs_list: List[Dict[str, Any]] = [
        {
            'id': dog.id,
            'name': dog.name,
            'breed': dog.breed
        }
        for dog in dogs_query
    ]
    
    return jsonify({
        'dogs': dogs_list,
        'page': page,
        'per_page': per_page,
        'total': total,
        'total_pages': max(1, -(-total // per_page))
    })

@app.route('/api/dogs/<int:id>', methods=['GET'])
def get_dog(id: int) -> tuple[Response, int] | Response:
    # Query the specific dog by ID and join with breed to get breed name
    dog_query = db.session.query(
        Dog.id,
        Dog.name,
        Breed.name.label('breed'),
        Dog.age,
        Dog.description,
        Dog.gender,
        Dog.status
    ).join(Breed, Dog.breed_id == Breed.id).filter(Dog.id == id).first()
    
    # Return 404 if dog not found
    if not dog_query:
        return jsonify({"error": "Dog not found"}), 404
    
    # Convert the result to a dictionary
    dog: Dict[str, Any] = {
        'id': dog_query.id,
        'name': dog_query.name,
        'breed': dog_query.breed,
        'age': dog_query.age,
        'description': dog_query.description,
        'gender': dog_query.gender,
        'status': dog_query.status.name
    }
    
    return jsonify(dog)

def _apply_reminder_fields(data: Dict[str, Any], reminder: Reminder, creating: bool) -> Dict[str, str]:
    """Validate and apply request fields onto a Reminder. Returns field -> error message."""
    errors: Dict[str, str] = {}

    if creating or 'type' in data:
        type_value = data.get('type')
        if type_value is None:
            errors['type'] = 'type is required'
        else:
            try:
                reminder.type = type_value
            except ValueError as e:
                errors['type'] = str(e)

    if creating or 'due_at' in data:
        due_at_value = data.get('due_at')
        if due_at_value is None:
            errors['due_at'] = 'due_at is required'
        else:
            try:
                reminder.due_at = parse_iso_datetime(due_at_value, 'due_at')
            except ValueError as e:
                errors['due_at'] = str(e)

    if creating:
        try:
            reminder.timezone = data.get('timezone') or 'UTC'
        except ValueError as e:
            errors['timezone'] = str(e)
    elif 'timezone' in data:
        try:
            reminder.timezone = data.get('timezone')
        except ValueError as e:
            errors['timezone'] = str(e)

    if 'description' in data:
        try:
            reminder.description = data.get('description')
        except ValueError as e:
            errors['description'] = str(e)

    if creating or 'recurrence_rule' in data:
        try:
            reminder.set_recurrence_rule(data.get('recurrence_rule'))
        except ValueError as e:
            errors['recurrence_rule'] = str(e)

    return errors


@app.route('/api/reminders', methods=['POST'])
def create_reminder() -> tuple[Response, int]:
    data = request.get_json(silent=True) or {}
    reminder = Reminder()
    errors = _apply_reminder_fields(data, reminder, creating=True)
    if errors:
        return jsonify({'errors': errors}), 400

    db.session.add(reminder)
    db.session.commit()
    return jsonify(reminder.to_dict()), 201


@app.route('/api/reminders', methods=['GET'])
def list_reminders() -> tuple[Response, int] | Response:
    status_filter = request.args.get('status')
    if status_filter and status_filter not in VALID_REMINDER_STATUS_FILTERS:
        return jsonify({
            'errors': {'status': f"status must be one of: {', '.join(VALID_REMINDER_STATUS_FILTERS)}"}
        }), 400

    page = max(1, request.args.get('page', 1, type=int))
    per_page = max(1, min(request.args.get('per_page', 10, type=int), 100))

    reminders: List[Reminder] = Reminder.query.filter(
        Reminder.deleted_at.is_(None)
    ).order_by(Reminder.due_at.asc()).all()

    now = utcnow()
    if status_filter:
        reminders = [r for r in reminders if r.compute_status(now) == status_filter]

    total = len(reminders)
    start = (page - 1) * per_page
    page_items = reminders[start:start + per_page]

    return jsonify({
        'reminders': [r.to_dict() for r in page_items],
        'page': page,
        'per_page': per_page,
        'total': total,
        'total_pages': max(1, -(-total // per_page)),
    })


@app.route('/api/reminders/summary', methods=['GET'])
def reminders_summary() -> Response:
    now = utcnow()
    due_soon_cutoff = now + timedelta(hours=DUE_SOON_WINDOW_HOURS)

    active: List[Reminder] = Reminder.query.filter(
        Reminder.deleted_at.is_(None),
        Reminder.completed_at.is_(None),
    ).all()

    overdue = sum(1 for r in active if r.due_at <= now)
    due_soon = sum(1 for r in active if now < r.due_at <= due_soon_cutoff)

    return jsonify({'overdue': overdue, 'due_soon': due_soon})


@app.route('/api/reminders/<int:id>', methods=['GET'])
def get_reminder(id: int) -> tuple[Response, int] | Response:
    reminder = Reminder.query.filter(Reminder.id == id, Reminder.deleted_at.is_(None)).first()
    if not reminder:
        return jsonify({'error': 'Reminder not found'}), 404
    return jsonify(reminder.to_dict())


@app.route('/api/reminders/<int:id>', methods=['PUT'])
def update_reminder(id: int) -> tuple[Response, int] | Response:
    reminder = Reminder.query.filter(Reminder.id == id, Reminder.deleted_at.is_(None)).first()
    if not reminder:
        return jsonify({'error': 'Reminder not found'}), 404

    data = request.get_json(silent=True) or {}
    errors = _apply_reminder_fields(data, reminder, creating=False)
    if errors:
        db.session.rollback()
        return jsonify({'errors': errors}), 400

    reminder.updated_at = utcnow()
    db.session.commit()
    return jsonify(reminder.to_dict())


@app.route('/api/reminders/<int:id>', methods=['DELETE'])
def delete_reminder(id: int) -> tuple[Response, int]:
    reminder = Reminder.query.filter(Reminder.id == id, Reminder.deleted_at.is_(None)).first()
    if not reminder:
        return jsonify({'error': 'Reminder not found'}), 404

    reminder.deleted_at = utcnow()
    db.session.commit()
    return '', 204


@app.route('/api/reminders/<int:id>/complete', methods=['POST'])
def complete_reminder(id: int) -> tuple[Response, int] | Response:
    reminder = Reminder.query.filter(Reminder.id == id, Reminder.deleted_at.is_(None)).first()
    if not reminder:
        return jsonify({'error': 'Reminder not found'}), 404

    if reminder.completed_at is not None:
        return jsonify({
            'error': 'Reminder is already completed',
            'reminder': reminder.to_dict(),
        }), 409

    reminder.completed_at = utcnow()
    reminder.updated_at = reminder.completed_at

    next_reminder: Optional[Reminder] = None
    next_due_at = reminder.next_due_at()
    if next_due_at is not None:
        next_reminder = Reminder(
            type=reminder.type,
            due_at=next_due_at,
            timezone=reminder.timezone,
            description=reminder.description,
        )
        next_reminder.set_recurrence_rule(reminder.get_recurrence_rule())
        db.session.add(next_reminder)

    db.session.commit()

    response = reminder.to_dict()
    response['next_occurrence'] = next_reminder.to_dict() if next_reminder else None
    return jsonify(response)


if __name__ == '__main__':
    app.run(debug=True, port=5100) # Port 5100 to avoid macOS conflicts
