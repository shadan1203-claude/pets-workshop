# filepath: app/server/models/vaccination.py
from datetime import datetime
from . import db
from .base import BaseModel
from sqlalchemy.orm import validates, relationship

class Vaccination(BaseModel):
    """Model representing a vaccination record for a dog.

    Tracks vaccination dates, vaccine names, booster schedules, and notes.
    Soft-deleted records retain audit trail.
    """
    __tablename__ = 'vaccinations'

    id = db.Column(db.Integer, primary_key=True)
    dog_id = db.Column(db.Integer, db.ForeignKey('dogs.id'), nullable=False)
    vaccine_name = db.Column(db.String(100), nullable=False)
    vaccination_date = db.Column(db.DateTime, nullable=False)
    booster_due_date = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    soft_deleted = db.Column(db.Integer, default=0)  # 0 = active, 1 = deleted
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    dog = relationship('Dog', backref='vaccinations')
    reminders = relationship('Reminder', backref='vaccination', cascade='all, delete-orphan')

    # Indexes for performance
    __table_args__ = (
        db.Index('idx_vaccinations_dog_id', 'dog_id'),
        db.Index('idx_vaccinations_dog_date', 'dog_id', 'vaccination_date'),
        db.Index('idx_vaccinations_soft_deleted_dog', 'soft_deleted', 'dog_id'),
    )

    @validates('vaccine_name')
    def validate_vaccine_name(self, key, vaccine_name):
        """Validate vaccine name: required, non-empty string."""
        if vaccine_name is None:
            raise ValueError("Vaccine name is required")
        if not isinstance(vaccine_name, str):
            raise ValueError("Vaccine name must be a string")
        vaccine_name = vaccine_name.strip()
        if len(vaccine_name) == 0:
            raise ValueError("Vaccine name cannot be empty")
        if len(vaccine_name) > 100:
            raise ValueError("Vaccine name must be at most 100 characters")
        return vaccine_name

    @validates('vaccination_date')
    def validate_vaccination_date(self, key, vaccination_date):
        """Validate vaccination date: must not be in the future."""
        if vaccination_date is None:
            raise ValueError("Vaccination date is required")
        if not isinstance(vaccination_date, datetime):
            raise ValueError("Vaccination date must be a datetime object")
        if vaccination_date > datetime.utcnow():
            raise ValueError("Vaccination date cannot be in the future")
        return vaccination_date

    @validates('booster_due_date')
    def validate_booster_due_date(self, key, booster_due_date):
        """Validate booster due date: optional, must be after vaccination date if provided."""
        if booster_due_date is not None:
            if not isinstance(booster_due_date, datetime):
                raise ValueError("Booster due date must be a datetime object")
        return booster_due_date

    @validates('notes')
    def validate_notes(self, key, notes):
        """Validate notes: optional, max 1000 characters."""
        if notes is not None:
            if not isinstance(notes, str):
                raise ValueError("Notes must be a string")
            if len(notes) > 1000:
                raise ValueError("Notes must be at most 1000 characters")
        return notes

    def __repr__(self):
        return f'<Vaccination {self.vaccine_name} for Dog {self.dog_id} on {self.vaccination_date}>'

    def to_dict(self):
        """Serialize vaccination record to dictionary for JSON responses."""
        return {
            'id': self.id,
            'dog_id': self.dog_id,
            'vaccine_name': self.vaccine_name,
            'vaccination_date': self.vaccination_date.isoformat() + 'Z' if self.vaccination_date else None,
            'booster_due_date': self.booster_due_date.isoformat() + 'Z' if self.booster_due_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
        }
