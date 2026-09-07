# filepath: app/server/models/reminder.py
import calendar
import json
from datetime import timedelta

from . import db
from .base import BaseModel
from sqlalchemy.orm import validates
from utils.time_utils import utcnow, to_iso_utc

REMINDER_TYPES = ('vaccination', 'medication', 'grooming', 'appointment', 'other')
RECURRENCE_FREQUENCIES = ('daily', 'weekly', 'monthly')


class Reminder(BaseModel):
    __tablename__ = 'reminders'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    due_at = db.Column(db.DateTime, nullable=False)
    timezone = db.Column(db.String(50), nullable=False, default='UTC')
    description = db.Column(db.Text, nullable=True)
    recurrence_rule = db.Column(db.Text, nullable=True)  # JSON: {"freq": "daily", "interval": 1}
    completed_at = db.Column(db.DateTime, nullable=True)
    deleted_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    @validates('type')
    def validate_type(self, key, value):
        if not isinstance(value, str) or value.strip() not in REMINDER_TYPES:
            raise ValueError(f"type must be one of: {', '.join(REMINDER_TYPES)}")
        return value.strip()

    @validates('timezone')
    def validate_timezone(self, key, value):
        return self.validate_string_length('timezone', value, min_length=1, allow_none=False)

    @validates('description')
    def validate_description(self, key, value):
        if value is not None and not isinstance(value, str):
            raise ValueError('description must be a string')
        return value

    @staticmethod
    def parse_recurrence_rule(rule):
        """Validate a recurrence rule dict and return it normalized, or None."""
        if rule is None:
            return None

        if not isinstance(rule, dict):
            raise ValueError('recurrence_rule must be an object with freq and interval')

        freq = rule.get('freq')
        if freq not in RECURRENCE_FREQUENCIES:
            raise ValueError(f"recurrence_rule.freq must be one of: {', '.join(RECURRENCE_FREQUENCIES)}")

        interval = rule.get('interval', 1)
        if isinstance(interval, bool) or not isinstance(interval, int) or interval < 1:
            raise ValueError('recurrence_rule.interval must be a positive integer')

        return {'freq': freq, 'interval': interval}

    def set_recurrence_rule(self, rule):
        normalized = self.parse_recurrence_rule(rule)
        self.recurrence_rule = json.dumps(normalized) if normalized else None

    def get_recurrence_rule(self):
        return json.loads(self.recurrence_rule) if self.recurrence_rule else None

    def next_due_at(self):
        """Compute the next due date based on this reminder's recurrence rule."""
        rule = self.get_recurrence_rule()
        if rule is None:
            return None

        freq = rule['freq']
        interval = rule['interval']

        if freq == 'daily':
            return self.due_at + timedelta(days=interval)
        if freq == 'weekly':
            return self.due_at + timedelta(weeks=interval)
        if freq == 'monthly':
            month_index = self.due_at.month - 1 + interval
            year = self.due_at.year + month_index // 12
            month = month_index % 12 + 1
            day = min(self.due_at.day, calendar.monthrange(year, month)[1])
            return self.due_at.replace(year=year, month=month, day=day)

        raise ValueError(f'Unsupported recurrence frequency: {freq}')

    def compute_status(self, now=None):
        """Derived status: completed > overdue > upcoming. due_at == now counts as overdue."""
        if self.completed_at is not None:
            return 'completed'
        if now is None:
            now = utcnow()
        if self.due_at <= now:
            return 'overdue'
        return 'upcoming'

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'due_at': to_iso_utc(self.due_at),
            'timezone': self.timezone,
            'description': self.description,
            'recurrence_rule': self.get_recurrence_rule(),
            'is_recurring': self.recurrence_rule is not None,
            'status': self.compute_status(),
            'completed_at': to_iso_utc(self.completed_at),
            'deleted_at': to_iso_utc(self.deleted_at),
            'created_at': to_iso_utc(self.created_at),
            'updated_at': to_iso_utc(self.updated_at),
        }

    def __repr__(self):
        return f'<Reminder {self.id}, type: {self.type}, due_at: {self.due_at}>'
