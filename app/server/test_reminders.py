import os
import unittest
from datetime import timedelta

# Point the app at a scratch SQLite file before importing it, so reminder
# tests never touch the real dogshelter.db used by the running app.
_TEST_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_reminders.db')
os.environ['DATABASE_PATH'] = _TEST_DB_PATH

from app import app, db  # noqa: E402  (import must follow env var setup above)
from models import Reminder  # noqa: E402
from utils.time_utils import utcnow, to_iso_utc  # noqa: E402

# filepath: app/server/test_reminders.py
class TestReminders(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        app.config['TESTING'] = True

        with app.app_context():
            db.session.query(Reminder).delete()
            db.session.commit()

    def tearDown(self):
        with app.app_context():
            db.session.query(Reminder).delete()
            db.session.commit()

    @classmethod
    def tearDownClass(cls):
        with app.app_context():
            db.session.remove()
        if os.path.exists(_TEST_DB_PATH):
            try:
                os.remove(_TEST_DB_PATH)
            except OSError:
                pass

    def _create(self, **overrides):
        payload = {
            'type': 'vaccination',
            'due_at': '2099-01-01T00:00:00Z',
        }
        payload.update(overrides)
        return self.app.post('/api/reminders', json=payload)

    # --- Create ---------------------------------------------------------

    def test_create_valid_reminder_returns_id_and_timestamps(self):
        response = self._create()
        self.assertEqual(response.status_code, 201)

        data = response.get_json()
        self.assertIn('id', data)
        self.assertIsInstance(data['id'], int)
        self.assertIsNotNone(data['created_at'])
        self.assertIsNotNone(data['updated_at'])
        self.assertEqual(data['status'], 'upcoming')

    def test_create_invalid_inputs_returns_400_with_field_errors(self):
        response = self.app.post('/api/reminders', json={'type': 'not-a-real-type', 'due_at': 'garbage'})
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertIn('errors', data)
        self.assertIn('type', data['errors'])
        self.assertIn('due_at', data['errors'])

    def test_create_missing_fields_returns_400(self):
        response = self.app.post('/api/reminders', json={})
        self.assertEqual(response.status_code, 400)
        errors = response.get_json()['errors']
        self.assertIn('type', errors)
        self.assertIn('due_at', errors)

    def test_create_invalid_recurrence_rule_returns_400(self):
        response = self._create(recurrence_rule={'freq': 'yearly', 'interval': 1})
        self.assertEqual(response.status_code, 400)
        self.assertIn('recurrence_rule', response.get_json()['errors'])

    # --- List -------------------------------------------------------------

    def test_list_reminders_shows_type_due_at_recurrence_and_status(self):
        self._create(due_at='2020-01-01T00:00:00Z', recurrence_rule={'freq': 'weekly', 'interval': 2})
        self._create(due_at='2099-01-01T00:00:00Z')

        response = self.app.get('/api/reminders')
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertEqual(data['total'], 2)
        statuses = {r['status'] for r in data['reminders']}
        self.assertEqual(statuses, {'overdue', 'upcoming'})

        overdue_reminder = next(r for r in data['reminders'] if r['status'] == 'overdue')
        self.assertEqual(overdue_reminder['type'], 'vaccination')
        self.assertTrue(overdue_reminder['is_recurring'])
        self.assertEqual(overdue_reminder['recurrence_rule'], {'freq': 'weekly', 'interval': 2})

    def test_list_supports_status_filter(self):
        self._create(due_at='2020-01-01T00:00:00Z')
        self._create(due_at='2099-01-01T00:00:00Z')

        response = self.app.get('/api/reminders?status=upcoming')
        data = response.get_json()
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['reminders'][0]['status'], 'upcoming')

    def test_list_invalid_status_filter_returns_400(self):
        response = self.app.get('/api/reminders?status=bogus')
        self.assertEqual(response.status_code, 400)

    def test_list_supports_pagination(self):
        for _ in range(5):
            self._create()

        response = self.app.get('/api/reminders?page=2&per_page=2')
        data = response.get_json()
        self.assertEqual(data['page'], 2)
        self.assertEqual(data['per_page'], 2)
        self.assertEqual(data['total'], 5)
        self.assertEqual(data['total_pages'], 3)
        self.assertEqual(len(data['reminders']), 2)

    def test_list_excludes_deleted_reminders(self):
        created = self._create().get_json()
        self.app.delete(f"/api/reminders/{created['id']}")

        response = self.app.get('/api/reminders')
        self.assertEqual(response.get_json()['total'], 0)

    # --- Edit ---------------------------------------------------------

    def test_edit_updates_persist_and_status_recomputes(self):
        created = self._create(due_at='2020-01-01T00:00:00Z').get_json()
        self.assertEqual(created['status'], 'overdue')

        response = self.app.put(f"/api/reminders/{created['id']}", json={'due_at': '2099-01-01T00:00:00Z'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['status'], 'upcoming')

        refetched = self.app.get(f"/api/reminders/{created['id']}").get_json()
        self.assertEqual(refetched['due_at'], '2099-01-01T00:00:00+00:00')
        self.assertEqual(refetched['status'], 'upcoming')

    def test_edit_missing_reminder_returns_404(self):
        response = self.app.put('/api/reminders/999999', json={'due_at': '2099-01-01T00:00:00Z'})
        self.assertEqual(response.status_code, 404)

    def test_edit_invalid_update_returns_400(self):
        created = self._create().get_json()
        response = self.app.put(f"/api/reminders/{created['id']}", json={'due_at': 'not-a-date'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('due_at', response.get_json()['errors'])

    # --- Delete ---------------------------------------------------------

    def test_delete_removes_from_list_and_get_returns_404(self):
        created = self._create().get_json()

        response = self.app.delete(f"/api/reminders/{created['id']}")
        self.assertEqual(response.status_code, 204)

        self.assertEqual(self.app.get(f"/api/reminders/{created['id']}").status_code, 404)
        self.assertEqual(self.app.get('/api/reminders').get_json()['total'], 0)

    def test_delete_missing_reminder_returns_404(self):
        response = self.app.delete('/api/reminders/999999')
        self.assertEqual(response.status_code, 404)

    # --- Complete ---------------------------------------------------------

    def test_complete_sets_completed_at_and_status(self):
        created = self._create().get_json()

        response = self.app.post(f"/api/reminders/{created['id']}/complete")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsNotNone(data['completed_at'])
        self.assertEqual(data['status'], 'completed')

    def test_complete_is_idempotent_returns_409_on_repeat(self):
        created = self._create().get_json()
        self.app.post(f"/api/reminders/{created['id']}/complete")

        response = self.app.post(f"/api/reminders/{created['id']}/complete")
        self.assertEqual(response.status_code, 409)

    def test_complete_missing_reminder_returns_404(self):
        response = self.app.post('/api/reminders/999999/complete')
        self.assertEqual(response.status_code, 404)

    # --- Recurring ---------------------------------------------------------

    def test_complete_recurring_reminder_schedules_next_occurrence(self):
        created = self._create(
            due_at='2099-01-01T00:00:00Z',
            recurrence_rule={'freq': 'monthly', 'interval': 1},
        ).get_json()

        response = self.app.post(f"/api/reminders/{created['id']}/complete")
        data = response.get_json()

        self.assertIsNotNone(data['next_occurrence'])
        self.assertEqual(data['next_occurrence']['due_at'], '2099-02-01T00:00:00+00:00')
        self.assertEqual(data['next_occurrence']['status'], 'upcoming')
        self.assertIsNone(data['next_occurrence']['completed_at'])

        listing = self.app.get('/api/reminders').get_json()
        self.assertEqual(listing['total'], 2)

    def test_complete_non_recurring_reminder_does_not_schedule_next(self):
        created = self._create().get_json()
        response = self.app.post(f"/api/reminders/{created['id']}/complete")
        self.assertIsNone(response.get_json()['next_occurrence'])

        listing = self.app.get('/api/reminders').get_json()
        self.assertEqual(listing['total'], 1)

    def test_completing_recurring_reminder_twice_does_not_duplicate_next_occurrence(self):
        created = self._create(recurrence_rule={'freq': 'daily', 'interval': 1}).get_json()
        self.app.post(f"/api/reminders/{created['id']}/complete")
        self.app.post(f"/api/reminders/{created['id']}/complete")  # idempotent no-op (409)

        listing = self.app.get('/api/reminders').get_json()
        self.assertEqual(listing['total'], 2)

    # --- Overdue boundary ---------------------------------------------------------

    def test_due_at_equal_to_now_is_treated_as_overdue(self):
        now = utcnow()
        reminder = Reminder(type='vaccination', due_at=now)
        self.assertEqual(reminder.compute_status(now=now), 'overdue')

    # --- Notifications summary ---------------------------------------------------------

    def test_summary_counts_overdue_and_due_soon_excluding_deleted_and_completed(self):
        now = utcnow()
        self._create(due_at=to_iso_utc(now - timedelta(days=1)))  # overdue, active
        self._create(due_at=to_iso_utc(now + timedelta(days=30)))  # far upcoming, not due soon
        self._create(due_at=to_iso_utc(now + timedelta(hours=2)))  # due soon

        # A completed and a deleted reminder must not be counted even though overdue.
        completed = self._create(due_at=to_iso_utc(now - timedelta(days=5))).get_json()
        self.app.post(f"/api/reminders/{completed['id']}/complete")

        deleted = self._create(due_at=to_iso_utc(now - timedelta(days=5))).get_json()
        self.app.delete(f"/api/reminders/{deleted['id']}")

        response = self.app.get('/api/reminders/summary')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['overdue'], 1)
        self.assertEqual(data['due_soon'], 1)


if __name__ == '__main__':
    unittest.main()
