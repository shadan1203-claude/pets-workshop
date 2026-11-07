import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from flask import Flask, Response, jsonify, request

from models import Breed, Dog, Reminder, Vaccination, db, init_db
from models.reminder import ReminderStatus

# Get the server directory path
base_dir: str = os.path.abspath(os.path.dirname(__file__))

app: Flask = Flask(__name__)
db_path: str = os.environ.get('DATABASE_PATH', os.path.join(base_dir, 'dogshelter.db'))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database with the app
init_db(app)


def _error(message: str, status_code: int = 400, details: Optional[Dict[str, Any]] = None) -> tuple[Response, int]:
    payload: Dict[str, Any] = {'error': message}
    if details:
        payload['details'] = details
    return jsonify(payload), status_code


def _parse_iso_date(raw_value: Any, field_name: str, *, allow_none: bool = False, allow_future: bool = False) -> Optional[datetime]:
    if raw_value is None or raw_value == '':
        if allow_none:
            return None
        raise ValueError(f'{field_name} is required')

    if isinstance(raw_value, datetime):
        parsed = raw_value
    else:
        value = str(raw_value).strip()
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            try:
                parsed = datetime.strptime(value, '%Y-%m-%d')
            except ValueError as exc:
                raise ValueError(f'Invalid date format. Use YYYY-MM-DD') from exc

    if parsed.tzinfo is not None:
        parsed = parsed.astimezone().replace(tzinfo=None)

    if not allow_future and parsed.date() > datetime.utcnow().date():
        raise ValueError(f'{field_name} cannot be in the future')

    return parsed


def _get_dog_or_404(dog_id: int) -> Optional[Dog]:
    dog = db.session.query(Dog).filter(Dog.id == dog_id).first()
    if not dog:
        return None
    return dog


def _serialize_vaccination(vaccination: Vaccination) -> Dict[str, Any]:
    return {
        'id': vaccination.id,
        'dog_id': vaccination.dog_id,
        'vaccine_name': vaccination.vaccine_name,
        'vaccination_date': vaccination.vaccination_date.isoformat() if vaccination.vaccination_date else None,
        'booster_due_date': vaccination.booster_due_date.isoformat() if vaccination.booster_due_date else None,
        'notes': vaccination.notes,
        'created_at': vaccination.created_at.isoformat() + 'Z' if vaccination.created_at else None,
        'updated_at': vaccination.updated_at.isoformat() + 'Z' if vaccination.updated_at else None,
    }


def _serialize_reminder(reminder: Reminder) -> Dict[str, Any]:
    today = datetime.utcnow().date()
    days_until_due = (reminder.due_date.date() - today).days if reminder.due_date else 0
    if reminder.status == ReminderStatus.ACKNOWLEDGED:
        status = 'acknowledged'
    elif reminder.due_date and reminder.due_date.date() < today:
        status = 'overdue'
    else:
        status = 'pending'

    return {
        'id': reminder.id,
        'dog_id': reminder.dog_id,
        'vaccination_id': reminder.vaccination_id,
        'vaccine_name': reminder.vaccine_name,
        'due_date': reminder.due_date.date().isoformat() if reminder.due_date else None,
        'days_until_due': days_until_due,
        'status': status,
        'created_at': reminder.created_at.isoformat() + 'Z' if reminder.created_at else None,
        'updated_at': reminder.updated_at.isoformat() + 'Z' if reminder.updated_at else None,
    }


@app.route('/api/dogs', methods=['GET'])
def get_dogs() -> Response:
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 6, type=int)
    breed = request.args.get('breed', type=str)
    page = max(1, page)
    per_page = max(1, min(per_page, 100))

    query = db.session.query(
        Dog.id,
        Dog.name,
        Breed.name.label('breed')
    ).join(Breed, Dog.breed_id == Breed.id)

    if breed is not None:
        breed_filter = breed.strip()
        if breed_filter:
            escaped_breed_filter = (
                breed_filter
                .replace('\\', '\\\\')
                .replace('%', '\\%')
                .replace('_', '\\_')
            )
            query = query.filter(Breed.name.ilike(escaped_breed_filter, escape='\\'))

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


@app.route('/api/breeds', methods=['GET'])
def get_breeds() -> Response:
    breeds = db.session.query(Breed).order_by(Breed.name.asc()).all()
    return jsonify([
        {'id': breed.id if hasattr(breed, 'id') else breed[0], 'name': breed.name if hasattr(breed, 'name') else breed[1]}
        for breed in breeds
    ])


@app.route('/api/dogs/<int:id>', methods=['GET'])
def get_dog(id: int) -> tuple[Response, int] | Response:
    dog_query = db.session.query(
        Dog.id,
        Dog.name,
        Breed.name.label('breed'),
        Dog.age,
        Dog.description,
        Dog.gender,
        Dog.status
    ).join(Breed, Dog.breed_id == Breed.id).filter(Dog.id == id).first()

    if not dog_query:
        return jsonify({"error": "Dog not found"}), 404

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


@app.route('/api/dogs/<int:dog_id>/vaccinations', methods=['GET'])
def get_dog_vaccinations(dog_id: int) -> tuple[Response, int] | Response:
    dog = _get_dog_or_404(dog_id)
    if dog is None:
        return _error('Dog not found', 404)

    query = db.session.query(Vaccination).filter(Vaccination.dog_id == dog_id, Vaccination.soft_deleted == 0)

    vaccine_name = request.args.get('vaccine_name', type=str)
    if vaccine_name is not None:
        query = query.filter(Vaccination.vaccine_name.ilike(f'%{vaccine_name.strip()}%'))

    start_date = request.args.get('start_date', type=str)
    if start_date:
        try:
            parsed_start = _parse_iso_date(start_date, 'start_date')
            query = query.filter(Vaccination.vaccination_date >= parsed_start)
        except ValueError as exc:
            return _error('Invalid input', 400, {'start_date': str(exc)})

    end_date = request.args.get('end_date', type=str)
    if end_date:
        try:
            parsed_end = _parse_iso_date(end_date, 'end_date')
            query = query.filter(Vaccination.vaccination_date <= parsed_end)
        except ValueError as exc:
            return _error('Invalid input', 400, {'end_date': str(exc)})

    vaccinations = query.order_by(Vaccination.vaccination_date.desc()).all()
    return jsonify({'vaccinations': [_serialize_vaccination(item) for item in vaccinations]})


@app.route('/api/dogs/<int:dog_id>/vaccinations', methods=['POST'])
def create_vaccination(dog_id: int) -> tuple[Response, int] | Response:
    dog = _get_dog_or_404(dog_id)
    if dog is None:
        return _error('Dog not found', 404)

    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return _error('Invalid input', 400, {'request': 'JSON body required'})

    details: Dict[str, Any] = {}
    vaccine_name = str(payload.get('vaccine_name', '')).strip()
    if not vaccine_name:
        details['vaccine_name'] = 'Vaccine name is required'

    vaccination_date_raw = payload.get('vaccination_date')
    try:
        vaccination_date = _parse_iso_date(vaccination_date_raw, 'vaccination_date')
    except ValueError as exc:
        details['vaccination_date'] = str(exc)
        vaccination_date = None

    booster_due_date = None
    booster_due_raw = payload.get('booster_due_date')
    if booster_due_raw not in (None, ''):
        try:
            booster_due_date = _parse_iso_date(booster_due_raw, 'booster_due_date', allow_future=True)
        except ValueError as exc:
            details['booster_due_date'] = str(exc)

    notes = payload.get('notes')
    if notes is not None and len(str(notes)) > 1000:
        details['notes'] = 'Notes must be at most 1000 characters'

    if details:
        return _error('Invalid input', 400, details)

    duplicate = db.session.query(Vaccination).filter(
        Vaccination.dog_id == dog_id,
        Vaccination.soft_deleted == 0,
        Vaccination.vaccine_name.ilike(vaccine_name),
        Vaccination.vaccination_date == vaccination_date
    ).first()
    if duplicate:
        return _error('Invalid input', 400, {'vaccine_name': 'A vaccination for this vaccine on this date already exists'})

    vaccination = Vaccination(
        dog_id=dog_id,
        vaccine_name=vaccine_name,
        vaccination_date=vaccination_date,
        booster_due_date=booster_due_date,
        notes=notes,
        soft_deleted=0,
    )
    db.session.add(vaccination)
    db.session.flush()

    if booster_due_date:
        reminder = Reminder(
            dog_id=dog_id,
            vaccination_id=vaccination.id,
            vaccine_name=vaccine_name,
            due_date=booster_due_date,
            status=ReminderStatus.PENDING,
            soft_deleted=0,
        )
        db.session.add(reminder)

    db.session.commit()
    return jsonify(_serialize_vaccination(vaccination)), 201


@app.route('/api/dogs/<int:dog_id>/vaccinations/<int:vaccination_id>', methods=['PUT'])
def update_vaccination(dog_id: int, vaccination_id: int) -> tuple[Response, int] | Response:
    dog = _get_dog_or_404(dog_id)
    if dog is None:
        return _error('Dog not found', 404)

    vaccination = db.session.query(Vaccination).filter(
        Vaccination.id == vaccination_id,
        Vaccination.dog_id == dog_id,
    ).first()
    if vaccination is None:
        return _error('Vaccination not found', 404)

    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return _error('Invalid input', 400, {'request': 'JSON body required'})

    details: Dict[str, Any] = {}
    if 'vaccine_name' in payload:
        vaccine_name = str(payload.get('vaccine_name', '')).strip()
        if not vaccine_name:
            details['vaccine_name'] = 'Vaccine name is required'
        else:
            vaccination.vaccine_name = vaccine_name

    if 'vaccination_date' in payload:
        try:
            vaccination.vaccination_date = _parse_iso_date(payload.get('vaccination_date'), 'vaccination_date')
        except ValueError as exc:
            details['vaccination_date'] = str(exc)

    if 'booster_due_date' in payload:
        booster_due_date = payload.get('booster_due_date')
        if booster_due_date in (None, ''):
            vaccination.booster_due_date = None
        else:
            try:
                vaccination.booster_due_date = _parse_iso_date(booster_due_date, 'booster_due_date', allow_future=True)
            except ValueError as exc:
                details['booster_due_date'] = str(exc)

    if 'notes' in payload:
        notes = payload.get('notes')
        if notes is not None and len(str(notes)) > 1000:
            details['notes'] = 'Notes must be at most 1000 characters'
        else:
            vaccination.notes = notes

    if details:
        return _error('Invalid input', 400, details)

    vaccination.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(_serialize_vaccination(vaccination))


@app.route('/api/dogs/<int:dog_id>/vaccinations/<int:vaccination_id>', methods=['DELETE'])
def delete_vaccination(dog_id: int, vaccination_id: int) -> tuple[Response, int] | Response:
    dog = _get_dog_or_404(dog_id)
    if dog is None:
        return _error('Dog not found', 404)

    vaccination = db.session.query(Vaccination).filter(
        Vaccination.id == vaccination_id,
        Vaccination.dog_id == dog_id,
    ).first()
    if vaccination is None:
        return _error('Vaccination not found', 404)

    vaccination.soft_deleted = 1
    vaccination.updated_at = datetime.utcnow()
    db.session.query(Reminder).filter(
        Reminder.vaccination_id == vaccination_id,
        Reminder.dog_id == dog_id,
    ).delete()
    db.session.commit()
    return '', 204


@app.route('/api/dogs/<int:dog_id>/reminders', methods=['GET'])
def get_dog_reminders(dog_id: int) -> tuple[Response, int] | Response:
    dog = _get_dog_or_404(dog_id)
    if dog is None:
        return _error('Dog not found', 404)

    today = datetime.utcnow().date()
    reminders = db.session.query(Reminder).filter(
        Reminder.dog_id == dog_id,
        Reminder.soft_deleted == 0
    ).all()

    reminder_payload = []
    for reminder in reminders:
        if reminder.due_date is None:
            continue
        due_date = reminder.due_date.date()
        days_until_due = (due_date - today).days
        if days_until_due > 30:
            continue
        if reminder.status == ReminderStatus.ACKNOWLEDGED:
            status = 'acknowledged'
        elif due_date < today:
            status = 'overdue'
        else:
            status = 'pending'
        reminder_payload.append({
            'id': reminder.id,
            'dog_id': reminder.dog_id,
            'vaccination_id': reminder.vaccination_id,
            'vaccine_name': reminder.vaccine_name,
            'due_date': due_date.isoformat(),
            'days_until_due': days_until_due,
            'status': status,
            'created_at': reminder.created_at.isoformat() + 'Z' if reminder.created_at else None,
            'updated_at': reminder.updated_at.isoformat() + 'Z' if reminder.updated_at else None,
        })

    reminder_payload.sort(key=lambda item: item['due_date'])
    return jsonify({'reminders': reminder_payload})


@app.route('/api/dogs/<int:dog_id>/reminders/<int:reminder_id>', methods=['PATCH'])
def update_reminder_status(dog_id: int, reminder_id: int) -> tuple[Response, int] | Response:
    dog = _get_dog_or_404(dog_id)
    if dog is None:
        return _error('Dog not found', 404)

    reminder = db.session.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.dog_id == dog_id,
    ).first()
    if reminder is None:
        return _error('Reminder not found', 404)

    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return _error('Invalid input', 400, {'request': 'JSON body required'})

    status_value = payload.get('status', '')
    if status_value is None:
        return _error('Invalid input', 400, {'status': 'Status must be one of: pending, acknowledged, overdue'})

    normalized_status = str(status_value).strip().lower()
    status_map = {
        'pending': ReminderStatus.PENDING,
        'acknowledged': ReminderStatus.ACKNOWLEDGED,
        'overdue': ReminderStatus.OVERDUE,
    }
    if normalized_status not in status_map:
        return _error('Invalid input', 400, {'status': 'Status must be one of: pending, acknowledged, overdue'})

    reminder.status = status_map[normalized_status]
    reminder.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(_serialize_reminder(reminder))


@app.route('/health', methods=['GET'])
def health() -> Response:
    return jsonify({"status": "UP"})


if __name__ == '__main__':
    app.run(debug=True, port=5100)
