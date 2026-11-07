from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text

db = SQLAlchemy()

# Import models after db is defined to avoid circular imports
from .breed import Breed
from .dog import Dog
from .vaccination import Vaccination
from .reminder import Reminder


def _ensure_column(table_name, column_name, column_sql):
    inspector = inspect(db.engine)
    if table_name not in inspector.get_table_names():
        return
    existing_columns = {info['name'] for info in inspector.get_columns(table_name)}
    if column_name not in existing_columns:
        db.session.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_sql}'))
        db.session.commit()


# Initialize function to be called from app.py
def init_db(app):
    db.init_app(app)

    # Create tables when initializing
    with app.app_context():
        # Handle older SQLite databases created before the vaccination/reminder schema
        # was finalized and before the legacy index name conflict was corrected.
        try:
            db.session.execute(text('DROP INDEX IF EXISTS idx_dog_id'))
            db.session.commit()
        except Exception:
            db.session.rollback()

        _ensure_column('vaccinations', 'soft_deleted', 'soft_deleted INTEGER DEFAULT 0')
        _ensure_column('reminders', 'soft_deleted', 'soft_deleted INTEGER DEFAULT 0')
        db.create_all()