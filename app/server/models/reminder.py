# filepath: app/server/models/reminder.py
from datetime import datetime
from enum import Enum
from . import db
from .base import BaseModel
from sqlalchemy.orm import validates, relationship

class ReminderStatus(Enum):
    """Enumeration for reminder status values."""
    PENDING = 'pending'
    ACKNOWLEDGED = 'acknowledged'
    OVERDUE = 'overdue'

class Reminder(BaseModel):
    """Model representing a reminder for an upcoming vaccination.

    Tracks reminder status and links vaccination with dog for efficient querying.
    Status can be pending (upcoming), acknowledged (user has seen it), or overdue (past due).
    """
    __tablename__ = 'reminders'

    id = db.Column(db.Integer, primary_key=True)
    dog_id = db.Column(db.Integer, db.ForeignKey('dogs.id'), nullable=False)
    vaccination_id = db.Column(db.Integer, db.ForeignKey('vaccinations.id'), nullable=False)
    vaccine_name = db.Column(db.String(100), nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum(ReminderStatus), default=ReminderStatus.PENDING)
    soft_deleted = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    dog = relationship('Dog', backref='reminders')

    # Indexes for performance
    __table_args__ = (
        db.Index('idx_reminders_dog_id', 'dog_id'),
        db.Index('idx_reminders_dog_status', 'dog_id', 'status'),
        db.Index('idx_reminders_due_date', 'due_date'),
    )

    @validates('status')
    def validate_status(self, key, status):
        """Validate reminder status: must be one of the ReminderStatus enum values."""
        if status is not None and not isinstance(status, ReminderStatus):
            raise ValueError(f"Status must be one of: {', '.join([s.value for s in ReminderStatus])}")
        return status

    def __repr__(self):
        return f'<Reminder {self.vaccine_name} for Dog {self.dog_id}, Due: {self.due_date}, Status: {self.status.value}>'

    def to_dict(self):
        """Serialize reminder record to dictionary for JSON responses."""
        return {
            'id': self.id,
            'dog_id': self.dog_id,
            'vaccination_id': self.vaccination_id,
            'vaccine_name': self.vaccine_name,
            'due_date': self.due_date.isoformat() + 'Z' if self.due_date else None,
            'status': self.status.value if self.status else 'pending',
            'soft_deleted': self.soft_deleted,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
        }
