import os
from typing import Dict, List, Any, Optional
from flask import Flask, jsonify, request, Response
from sqlalchemy import func
from models import init_db, db, Dog, Breed

# Get the server directory path
base_dir: str = os.path.abspath(os.path.dirname(__file__))

app: Flask = Flask(__name__)
db_path: str = os.environ.get('DATABASE_PATH', os.path.join(base_dir, 'dogshelter.db'))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database with the app
init_db(app)

# Maximum accepted length for the name and breed/category filters
MAX_FILTER_LENGTH: int = 100

@app.route('/api/dogs', methods=['GET'])
def get_dogs() -> tuple[Response, int] | Response:
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 6, type=int)
    name = request.args.get('name', '', type=str).strip()
    # 'category' is an alias for 'breed'; 'breed' takes precedence when both are given
    breed = (request.args.get('breed') or request.args.get('category') or '').strip()

    if len(name) > MAX_FILTER_LENGTH:
        return jsonify({'error': f'name must be at most {MAX_FILTER_LENGTH} characters'}), 400
    if len(breed) > MAX_FILTER_LENGTH:
        return jsonify({'error': f'breed must be at most {MAX_FILTER_LENGTH} characters'}), 400

    page = max(1, page)
    per_page = max(1, min(per_page, 100))

    query = db.session.query(
        Dog.id,
        Dog.name,
        Breed.name.label('breed')
    ).join(Breed, Dog.breed_id == Breed.id)

    if name:
        query = query.filter(Dog.name.ilike(f'%{name}%'))

    # An unknown breed is not an error: it simply yields an empty result set
    if breed:
        query = query.filter(func.lower(Breed.name) == breed.lower())

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
    breeds = db.session.query(Breed.id, Breed.name).order_by(Breed.name.asc()).all()
    return jsonify({
        'breeds': [{'id': breed.id, 'name': breed.name} for breed in breeds]
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

## HERE

if __name__ == '__main__':
    app.run(debug=True, port=5100) # Port 5100 to avoid macOS conflicts
