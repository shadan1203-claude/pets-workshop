import unittest
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch, MagicMock
import json
from sqlalchemy import create_engine, event, select, text
from sqlalchemy.dialects.sqlite import dialect
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.pool import StaticPool
from app import app  # Changed from relative import to absolute import
from models import Breed, Dog, Reminder, Vaccination, db
from models.dog import AdoptionStatus
from utils.seed_test_database import TEST_BREEDS, TEST_DOGS

# filepath: app/server/test_app.py
class TestApp(unittest.TestCase):
    def setUp(self):
        # Create a test client using Flask's test client
        self.app = app.test_client()
        self.app.testing = True
        # Turn off database initialization for tests
        app.config['TESTING'] = True
        
    def _create_mock_dog(self, dog_id, name, breed):
        """Helper method to create a mock dog with standard attributes"""
        dog = MagicMock(spec=['to_dict', 'id', 'name', 'breed'])
        dog.id = dog_id
        dog.name = name
        dog.breed = breed
        dog.to_dict.return_value = {'id': dog_id, 'name': name, 'breed': breed}
        return dog
        
    def _setup_query_mock(self, mock_query, dogs):
        """Helper method to configure the query mock"""
        mock_query_instance = MagicMock()
        mock_query.return_value = mock_query_instance
        mock_query_instance.join.return_value = mock_query_instance
        mock_query_instance.order_by.return_value = mock_query_instance
        mock_query_instance.count.return_value = len(dogs)
        mock_query_instance.offset.return_value = mock_query_instance
        mock_query_instance.limit.return_value = mock_query_instance
        mock_query_instance.all.return_value = dogs
        return mock_query_instance

    @patch('app.db.session.query')
    def test_get_dogs_success(self, mock_query):
        """Test successful retrieval of multiple dogs"""
        # Arrange
        dog1 = self._create_mock_dog(1, "Buddy", "Labrador")
        dog2 = self._create_mock_dog(2, "Max", "German Shepherd")
        mock_dogs = [dog1, dog2]
        
        self._setup_query_mock(mock_query, mock_dogs)
        
        # Act
        response = self.app.get('/api/dogs')
        
        # Assert
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(len(data['dogs']), 2)
        self.assertEqual(data['page'], 1)
        self.assertEqual(data['total'], 2)
        
        # Verify first dog
        self.assertEqual(data['dogs'][0]['id'], 1)
        self.assertEqual(data['dogs'][0]['name'], "Buddy")
        self.assertEqual(data['dogs'][0]['breed'], "Labrador")
        
        # Verify second dog
        self.assertEqual(data['dogs'][1]['id'], 2)
        self.assertEqual(data['dogs'][1]['name'], "Max")
        self.assertEqual(data['dogs'][1]['breed'], "German Shepherd")
        
        # Verify query was called
        mock_query.assert_called_once()
        
    @patch('app.db.session.query')
    def test_get_dogs_empty(self, mock_query):
        """Test retrieval when no dogs are available"""
        # Arrange
        self._setup_query_mock(mock_query, [])

        # Act
        response = self.app.get('/api/dogs')

        # Assert
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['dogs'], [])
        self.assertEqual(data['total'], 0)

    @patch('app.db.session.query')
    def test_get_dogs_by_breed_filter(self, mock_query):
        """Test retrieval filtered by breed name"""
        dog = self._create_mock_dog(1, "Buddy", "Golden Retriever")
        mock_query_instance = MagicMock()
        mock_query.return_value = mock_query_instance
        mock_query_instance.join.return_value = mock_query_instance
        mock_query_instance.filter.return_value = mock_query_instance
        mock_query_instance.order_by.return_value = mock_query_instance
        mock_query_instance.count.return_value = 1
        mock_query_instance.offset.return_value = mock_query_instance
        mock_query_instance.limit.return_value = mock_query_instance
        mock_query_instance.all.return_value = [dog]

        response = self.app.get('/api/dogs?breed=Golden%20Retriever')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['dogs']), 1)
        self.assertEqual(data['dogs'][0]['breed'], 'Golden Retriever')
        mock_query_instance.filter.assert_called_once()

    @patch('app.db.session.query')
    def test_get_dogs_by_breed_escapes_like_wildcards(self, mock_query):
        """Treat wildcard characters in a breed value as literal name characters."""
        mock_query_instance = self._setup_query_mock(mock_query, [])
        mock_query_instance.filter.return_value = mock_query_instance

        response = self.app.get('/api/dogs?breed=Golden%25_Retriever')

        self.assertEqual(response.status_code, 200)
        filter_expression = mock_query_instance.filter.call_args.args[0]
        compiled_filter = filter_expression.compile(dialect=dialect())
        self.assertIn('ESCAPE', str(compiled_filter).upper())
        self.assertEqual(
            list(compiled_filter.params.values())[0],
            r'Golden\%\_Retriever'
        )

    @patch('app.db.session.query')
    def test_get_dogs_matches_like_special_characters_literally(self, mock_query):
        """Wildcard and escape characters must match breed names literally."""
        mock_query_instance = self._setup_query_mock(mock_query, [])
        mock_query_instance.filter.return_value = mock_query_instance

        breed_names = ['P%up', 'P_up', r'P\up', 'Pup', 'P-up']
        engine = create_engine('sqlite://')
        Breed.__table__.create(engine)
        with engine.begin() as connection:
            connection.execute(
                Breed.__table__.insert(),
                [{'name': name} for name in breed_names]
            )

        with engine.connect() as connection:
            for breed_name in ('P%up', 'P_up', r'P\up'):
                with self.subTest(breed=breed_name):
                    self.app.get('/api/dogs', query_string={'breed': breed_name})
                    filter_expression = mock_query_instance.filter.call_args.args[0]
                    matches = connection.execute(
                        select(Breed.name).where(filter_expression).order_by(Breed.name)
                    ).scalars().all()
                    self.assertEqual(matches, [breed_name])

        engine.dispose()

    @patch('app.db.session.query')
    def test_get_dogs_structure(self, mock_query):
        """Test the response structure for a single dog"""
        # Arrange
        dog = self._create_mock_dog(1, "Buddy", "Labrador")
        self._setup_query_mock(mock_query, [dog])

        # Act
        response = self.app.get('/api/dogs')

        # Assert
        data = json.loads(response.data)
        self.assertIn('dogs', data)
        self.assertIn('page', data)
        self.assertIn('total', data)
        self.assertIn('total_pages', data)
        self.assertTrue(isinstance(data['dogs'], list))
        self.assertEqual(len(data['dogs']), 1)
        self.assertEqual(set(data['dogs'][0].keys()), {'id', 'name', 'breed'})

    @patch('app.db.session.query')
    def test_get_breeds_success(self, mock_query):
        """Test the breed catalog endpoint."""
        breeds = [
            SimpleNamespace(id=1, name='Golden Retriever'),
            SimpleNamespace(id=2, name='Husky')
        ]
        mock_query_instance = MagicMock()
        mock_query.return_value = mock_query_instance
        mock_query_instance.order_by.return_value = mock_query_instance
        mock_query_instance.all.return_value = breeds

        response = self.app.get('/api/breeds')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data, [
            {'id': 1, 'name': 'Golden Retriever'},
            {'id': 2, 'name': 'Husky'}
        ])

    def test_get_dog_vaccinations_success(self):
        """Test the existing dog vaccination list response without database access."""
        vaccination = SimpleNamespace(
            id=12,
            dog_id=1,
            vaccine_name='Rabies',
            vaccination_date=datetime(2025, 4, 3, 9, 0),
            booster_due_date=datetime(2026, 4, 3, 9, 0),
            notes='Initial dose',
            created_at=datetime(2025, 4, 3, 9, 30),
            updated_at=None,
        )
        query = MagicMock()
        query.filter.return_value = query
        query.order_by.return_value = query
        query.all.return_value = [vaccination]

        with patch('app._get_dog_or_404', return_value=SimpleNamespace(id=1)) as mock_get_dog, \
                patch('app.db.session.query', return_value=query) as mock_query:
            response = self.app.get('/api/dogs/1/vaccinations')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data), {
            'vaccinations': [{
                'id': 12,
                'dog_id': 1,
                'vaccine_name': 'Rabies',
                'vaccination_date': '2025-04-03T09:00:00',
                'booster_due_date': '2026-04-03T09:00:00',
                'notes': 'Initial dose',
                'created_at': '2025-04-03T09:30:00Z',
                'updated_at': None,
            }]
        })
        mock_get_dog.assert_called_once_with(1)
        mock_query.assert_called_once_with(Vaccination)
        query.filter.assert_called_once()
        query.order_by.assert_called_once()
        query.all.assert_called_once_with()

    # --- EPMCDMETST-70052: available_only filter (mocked query chain) ---

    MSG_EMPTY = "available_only must not be empty"
    MSG_REPEATED = "available_only may be supplied only once"
    MSG_INVALID = "available_only must be 'true' or 'false'"

    def _filter_mock(self, mock_query, dogs=None):
        mock_query_instance = self._setup_query_mock(mock_query, dogs or [])
        mock_query_instance.filter.return_value = mock_query_instance
        return mock_query_instance

    def _assert_400(self, response, message, raw_value=None):
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.mimetype, 'application/json')
        data = json.loads(response.data)
        self.assertEqual(set(data.keys()), {'error', 'details'})
        self.assertEqual(data['error'], 'Invalid input')
        self.assertEqual(set(data['details'].keys()), {'available_only'})
        self.assertEqual(data['details']['available_only'], message)
        if raw_value:
            self.assertNotIn(raw_value, response.get_data(as_text=True))

    @patch('app.db.session.query')
    def test_available_only_absent_leaves_query_unfiltered(self, mock_query):
        """TC-001: no available_only means no extra filter and an unchanged shape."""
        mock_query_instance = self._filter_mock(mock_query, [self._create_mock_dog(1, "Buddy", "Husky")])
        response = self.app.get('/api/dogs')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data)['total'], 1)
        mock_query_instance.filter.assert_not_called()

    @patch('app.db.session.query')
    def test_available_only_true_filters_once_in_any_case(self, mock_query):
        """TC-002: true, True and TRUE apply exactly one filter."""
        for value in ('true', 'True', 'TRUE'):
            with self.subTest(value=value):
                mock_query.reset_mock()
                mock_query_instance = self._filter_mock(mock_query)
                response = self.app.get('/api/dogs', query_string={'available_only': value})
                self.assertEqual(response.status_code, 200)
                mock_query_instance.filter.assert_called_once()

    @patch('app.db.session.query')
    def test_available_only_true_with_breed_applies_both_filters(self, mock_query):
        """TC-003: availability and breed are both applied before count."""
        mock_query_instance = self._filter_mock(mock_query)
        response = self.app.get('/api/dogs?available_only=true&breed=Golden%20Retriever')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_query_instance.filter.call_count, 2)

    @patch('app.db.session.query')
    def test_available_only_false_equals_absent(self, mock_query):
        """TC-004 (A-API-2 confirmed): false in any case applies no filter."""
        for value in ('false', 'False', 'FALSE'):
            with self.subTest(value=value):
                mock_query.reset_mock()
                mock_query_instance = self._filter_mock(mock_query)
                response = self.app.get('/api/dogs', query_string={'available_only': value})
                self.assertEqual(response.status_code, 200)
                mock_query_instance.filter.assert_not_called()

    @patch('app.db.session.query')
    def test_available_only_empty_and_bare_return_400(self, mock_query):
        """TC-005, TC-006: empty value and bare parameter are rejected."""
        self._filter_mock(mock_query)
        for url in ('/api/dogs?available_only=', '/api/dogs?available_only'):
            with self.subTest(url=url):
                self._assert_400(self.app.get(url), self.MSG_EMPTY)

    @patch('app.db.session.query')
    def test_available_only_repeated_returns_400(self, mock_query):
        """TC-007: two or more occurrences are rejected, even when valid and identical."""
        self._filter_mock(mock_query)
        for qs in ('available_only=true&available_only=true',
                   'available_only=true&available_only=false',
                   'available_only=false&available_only=true',
                   'available_only=true&available_only=true&available_only=true'):
            with self.subTest(qs=qs):
                self._assert_400(self.app.get('/api/dogs?' + qs), self.MSG_REPEATED)

    @patch('app.db.session.query')
    def test_available_only_non_boolean_text_returns_400(self, mock_query):
        """TC-008: other text is rejected."""
        self._filter_mock(mock_query)
        for value in ('maybe', 'ture', 'truee', '2', 'null', 'undefined'):
            with self.subTest(value=value):
                response = self.app.get('/api/dogs', query_string={'available_only': value})
                self._assert_400(response, self.MSG_INVALID, value)

    @patch('app.db.session.query')
    def test_available_only_boolean_synonyms_return_400(self, mock_query):
        """TC-009 (A-API-3 confirmed): 1/0/yes/no/on/off are rejected."""
        self._filter_mock(mock_query)
        for value in ('1', '0', 'yes', 'no', 'on', 'off', 'YES', 'No', 'ON', 'Off'):
            with self.subTest(value=value):
                response = self.app.get('/api/dogs', query_string={'available_only': value})
                self._assert_400(response, self.MSG_INVALID)

    @patch('app.db.session.query')
    def test_available_only_padded_values_return_400(self, mock_query):
        """TC-010 (A-API-1 confirmed): no trimming."""
        self._filter_mock(mock_query)
        for raw in ('%20true', 'true%20', '+true', '%20false', '%0Atrue'):
            with self.subTest(raw=raw):
                self._assert_400(self.app.get('/api/dogs?available_only=' + raw), self.MSG_INVALID)

    @patch('app.db.session.query')
    def test_available_only_hostile_input_is_rejected_without_echo(self, mock_query):
        """TC-011: hostile values give 400 and are never echoed."""
        self._filter_mock(mock_query)
        hostile = ['<script>alert(1)</script>', "' OR 1=1 --", '1; DROP TABLE dogs;--',
                   '\x00', ' true', 'x' * 4000, 'ＴＲＵＥ']
        for value in hostile:
            with self.subTest(value=value[:20]):
                response = self.app.get('/api/dogs', query_string={'available_only': value})
                self._assert_400(response, self.MSG_INVALID, value)

    @patch('app.db.session.query')
    def test_available_only_rejection_makes_no_database_access(self, mock_query):
        """TC-012: a rejected request never builds a query."""
        for qs in ('available_only=', 'available_only=true&available_only=true',
                   'available_only=maybe', 'available_only=maybe&page=abc&breed=x'):
            with self.subTest(qs=qs):
                response = self.app.get('/api/dogs?' + qs)
                self.assertEqual(response.status_code, 400)
        mock_query.assert_not_called()

    @patch('app.db.session.query')
    def test_available_only_repeated_takes_precedence_over_empty(self, mock_query):
        """TC-013: repeated is reported before empty."""
        self._filter_mock(mock_query)
        for qs in ('available_only=&available_only=true', 'available_only=&available_only='):
            with self.subTest(qs=qs):
                self._assert_400(self.app.get('/api/dogs?' + qs), self.MSG_REPEATED)

    @patch('app.db.session.query')
    def test_available_only_400_is_independent_of_other_parameters(self, mock_query):
        """TC-014: other parameters do not change the 400 body."""
        self._filter_mock(mock_query)
        for qs in ('available_only=maybe&page=999&per_page=1000&breed=Nothing',
                   'available_only=maybe&page=abc'):
            with self.subTest(qs=qs):
                self._assert_400(self.app.get('/api/dogs?' + qs), self.MSG_INVALID)

    @patch('app.db.session.query')
    def test_available_only_parameter_name_is_case_sensitive(self, mock_query):
        """TC-015: other spellings are ignored without error."""
        for qs in ('AVAILABLE_ONLY=true', 'Available_Only=true', 'availableOnly=true',
                   'available_only_=true', 'AVAILABLE_ONLY=maybe'):
            with self.subTest(qs=qs):
                mock_query.reset_mock()
                mock_query_instance = self._filter_mock(mock_query)
                response = self.app.get('/api/dogs?' + qs)
                self.assertEqual(response.status_code, 200)
                mock_query_instance.filter.assert_not_called()

    @patch('app.db.session.query')
    def test_available_only_response_has_no_status_field(self, mock_query):
        """TC-016: the response shape is unchanged with and without the filter."""
        for qs in ('', '?available_only=true'):
            with self.subTest(qs=qs):
                self._filter_mock(mock_query, [self._create_mock_dog(1, "Buddy", "Husky")])
                data = json.loads(self.app.get('/api/dogs' + qs).data)
                self.assertEqual(set(data.keys()), {'dogs', 'page', 'per_page', 'total', 'total_pages'})
                for dog in data['dogs']:
                    self.assertEqual(set(dog.keys()), {'id', 'name', 'breed'})

    @patch('app.db.session.query')
    def test_available_only_predicate_is_enum_member_comparison(self, mock_query):
        """TC-018: the predicate compares dogs.status with the AVAILABLE member."""
        mock_query_instance = self._filter_mock(mock_query)
        response = self.app.get('/api/dogs?available_only=true')
        self.assertEqual(response.status_code, 200)
        expression = mock_query_instance.filter.call_args.args[0]
        compiled = expression.compile(dialect=dialect())
        self.assertIn('dogs.status', str(compiled))
        self.assertEqual(list(compiled.params.values()), [AdoptionStatus.AVAILABLE])

    @patch('app.db.session.query')
    def test_available_only_per_page_is_clamped(self, mock_query):
        """TC-019: per_page clamp is unchanged with the filter."""
        for raw, expected in (('1000', 100), ('0', 1), ('-5', 1), ('abc', 6)):
            with self.subTest(per_page=raw):
                mock_query.reset_mock()
                mock_query_instance = self._filter_mock(mock_query)
                response = self.app.get('/api/dogs', query_string={'available_only': 'true', 'per_page': raw})
                self.assertEqual(response.status_code, 200)
                mock_query_instance.limit.assert_called_once_with(expected)
                self.assertEqual(json.loads(response.data)['per_page'], expected)

    @patch('app.db.session.query')
    def test_available_only_percent_encoded_and_lookalike_values(self, mock_query):
        """TC-020: decoding precedes parsing; look-alike characters are rejected."""
        mock_query_instance = self._filter_mock(mock_query)
        response = self.app.get('/api/dogs?available_only=%74rue')
        self.assertEqual(response.status_code, 200)
        mock_query_instance.filter.assert_called_once()
        for qs in ('available_only=%EF%BC%B4%EF%BC%B2%EF%BC%B5%EF%BC%A5', 'available_only=tru%C3%A9'):
            with self.subTest(qs=qs):
                self._assert_400(self.app.get('/api/dogs?' + qs), self.MSG_INVALID)

    @patch('app.db.session.query')
    def test_get_dogs_orders_by_id(self, mock_query):
        """T-03b (OQ-11): the dogs query is ordered by id before paging."""
        mock_query_instance = self._setup_query_mock(mock_query, [])
        self.app.get('/api/dogs')
        mock_query_instance.order_by.assert_called_once()
        compiled = str(mock_query_instance.order_by.call_args.args[0].compile(dialect=dialect()))
        self.assertEqual(compiled, 'dogs.id')

    def test_health_success(self):
        """Test the health check endpoint returns UP status"""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data, {"status": "UP"})


class TestAvailableOnlyRealSqlite(unittest.TestCase):
    """EPMCDMETST-70052: get_dogs against a real, seeded in-memory SQLite database.

    Isolation (decision R-A): an in-memory engine plus a patch of app.db.session.
    The tracked dogshelter.db and DATABASE_PATH are not used by these tests.
    """

    AVAILABLE_NAMES = ['Buddy', 'Bella', 'Charlie', 'Rocky', 'Sadie', 'Cooper', 'Rosie', 'Finn']

    def setUp(self):
        self.engine = create_engine(
            'sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool
        )
        db.metadata.create_all(self.engine)
        self.session = scoped_session(sessionmaker(bind=self.engine))
        for breed_data in TEST_BREEDS:
            self.session.add(Breed(name=breed_data['name'], description=breed_data['description']))
        self.session.flush()
        breed_ids = {b.name: b.id for b in self.session.query(Breed).all()}
        for dog_data in TEST_DOGS:
            self.session.add(Dog(
                name=dog_data['name'],
                breed_id=breed_ids[dog_data['breed']],
                age=dog_data['age'],
                gender=dog_data['gender'],
                status=dog_data['status'],
                description=dog_data['description'],
            ))
        self.session.commit()
        self.session.remove()

        patcher = patch('app.db.session', self.session)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.addCleanup(self.engine.dispose)
        self.addCleanup(self.session.remove)
        app.config['TESTING'] = True
        self.client = app.test_client()

    def _get(self, query_string=''):
        response = self.client.get('/api/dogs' + query_string)
        return response, json.loads(response.data)

    def _walk(self, extra='', per_page=6):
        """Collect every dog across all pages of a filtered or unfiltered listing."""
        collected = []
        page = 1
        while True:
            response, data = self._get(f'?per_page={per_page}&page={page}{extra}')
            self.assertEqual(response.status_code, 200)
            collected.extend(data['dogs'])
            if page >= data['total_pages']:
                return collected
            page += 1

    def test_filter_on_returns_only_available_dogs(self):
        """TC-021"""
        response, page1 = self._get('?available_only=true')
        _, page2 = self._get('?available_only=true&page=2')
        self.assertEqual(response.status_code, 200)
        self.assertEqual((page1['page'], page1['per_page'], page1['total'], page1['total_pages']), (1, 6, 8, 2))
        self.assertEqual((page2['page'], page2['total']), (2, 8))
        # OQ-11 add branch: absolute order by id
        self.assertEqual([d['name'] for d in page1['dogs']], self.AVAILABLE_NAMES[:6])
        self.assertEqual([d['name'] for d in page2['dogs']], self.AVAILABLE_NAMES[6:])
        names = {d['name'] for d in page1['dogs'] + page2['dogs']}
        self.assertEqual(names, set(self.AVAILABLE_NAMES))
        self.assertTrue(names.isdisjoint({'Luna', 'Max', 'Daisy', 'Duke', 'Molly'}))

    def test_false_and_absent_are_identical_and_unfiltered(self):
        """TC-022 (A-API-2 confirmed)"""
        bodies = []
        for qs in ('', '?available_only=false', '?available_only=FALSE'):
            response, data = self._get(qs)
            self.assertEqual(response.status_code, 200)
            bodies.append(response.data)
            self.assertEqual((data['total'], data['total_pages'], len(data['dogs'])), (13, 3, 6))
            names = [d['name'] for d in data['dogs']]
            self.assertIn('Luna', names)
            self.assertIn('Max', names)
        self.assertEqual(bodies[0], bodies[1])
        self.assertEqual(bodies[0], bodies[2])

    def test_filter_combined_with_breed(self):
        """TC-023"""
        expectations = {
            'Golden%20Retriever': ({'Buddy', 'Bella', 'Rocky', 'Cooper', 'Rosie', 'Finn'}, 6),
            'Husky': ({'Charlie', 'Sadie'}, 2),
            'German%20Shepherd': (set(), 0),
        }
        for breed, (names, total) in expectations.items():
            with self.subTest(breed=breed):
                _, data = self._get(f'?available_only=true&breed={breed}')
                self.assertEqual({d['name'] for d in data['dogs']}, names)
                self.assertEqual((data['total'], data['total_pages']), (total, 1))
        _, unfiltered_gr = self._get('?breed=Golden%20Retriever')
        _, unfiltered_gs = self._get('?breed=German%20Shepherd')
        self.assertEqual(unfiltered_gr['total'], 7)
        self.assertEqual(unfiltered_gs['total'], 3)
        _, lower = self._get('?available_only=true&breed=golden%20retriever')
        self.assertEqual(lower['total'], 6)

    def test_every_returned_dog_is_available(self):
        """TC-024: cross-check each id against GET /api/dogs/<id>, which exposes status."""
        filtered = self._walk('&available_only=true')
        self.assertEqual(len(filtered), 8)
        for dog in filtered:
            detail = json.loads(self.client.get(f"/api/dogs/{dog['id']}").data)
            self.assertEqual(detail['status'], 'AVAILABLE')
        returned_ids = {d['id'] for d in filtered}
        excluded = [d for d in self._walk() if d['id'] not in returned_ids]
        self.assertEqual(len(excluded), 5)
        for dog in excluded:
            detail = json.loads(self.client.get(f"/api/dogs/{dog['id']}").data)
            self.assertIn(detail['status'], ('PENDING', 'ADOPTED'))

    def test_page_beyond_filtered_range(self):
        """TC-025"""
        for page in ('3', '99'):
            with self.subTest(page=page):
                response, data = self._get(f'?available_only=true&page={page}')
                self.assertEqual(response.status_code, 200)
                self.assertEqual(data, {'dogs': [], 'page': int(page), 'per_page': 6, 'total': 8, 'total_pages': 2})
        for page in ('0', '-1', 'abc'):
            with self.subTest(page=page):
                _, data = self._get(f'?available_only=true&page={page}')
                self.assertEqual(data['page'], 1)
                self.assertEqual(len(data['dogs']), 6)

    def test_ordering_is_stable_without_duplicates_or_gaps(self):
        """TC-026 (OQ-11 add branch: ascending id as well)"""
        available_ids = {d['id'] for d in self._walk('&available_only=true')}
        self.assertEqual(len(available_ids), 8)
        for per_page in range(1, 7):
            with self.subTest(per_page=per_page):
                first = self._walk('&available_only=true', per_page)
                second = self._walk('&available_only=true', per_page)
                ids = [d['id'] for d in first]
                self.assertEqual(ids, [d['id'] for d in second])
                self.assertEqual(len(ids), len(set(ids)))
                self.assertEqual(set(ids), available_ids)
                self.assertEqual(ids, sorted(ids))

    def test_null_status_is_excluded_by_filter_and_included_without(self):
        """TC-027: a NULL-status row (explicit SQL NULL) is excluded only when the filter is on."""
        with self.engine.begin() as connection:
            connection.execute(text("INSERT INTO dogs (name, breed_id, status) VALUES ('Nully', 1, NULL)"))
            stored = connection.execute(text("SELECT COUNT(*) FROM dogs WHERE status IS NULL")).scalar()
        self.assertEqual(stored, 1)
        _, filtered = self._get('?available_only=true')
        _, unfiltered = self._get('')
        self.assertEqual(filtered['total'], 8)
        self.assertEqual(unfiltered['total'], 14)
        self.assertNotIn('Nully', {d['name'] for d in self._walk('&available_only=true')})
        self.assertIn('Nully', {d['name'] for d in self._walk()})

    def test_per_page_bounds_with_filter(self):
        """TC-028"""
        for qs in ('?available_only=true&per_page=100', '?available_only=true&per_page=1000'):
            with self.subTest(qs=qs):
                _, data = self._get(qs)
                self.assertEqual((len(data['dogs']), data['per_page'], data['total_pages']), (8, 100, 1))
        _, data = self._get('?available_only=true&per_page=1')
        self.assertEqual((len(data['dogs']), data['total_pages']), (1, 8))

    def test_rejected_and_hostile_requests_leave_data_intact(self):
        """TC-029"""
        for value in ('<script>alert(1)</script>', "' OR 1=1 --", '1; DROP TABLE dogs;--', 'maybe'):
            response = self.client.get('/api/dogs', query_string={'available_only': value})
            self.assertEqual(response.status_code, 400)
        with self.engine.connect() as connection:
            self.assertEqual(connection.execute(text('SELECT COUNT(*) FROM dogs')).scalar(), 13)
        _, filtered = self._get('?available_only=true')
        _, unfiltered = self._get('')
        self.assertEqual((filtered['total'], unfiltered['total']), (8, 13))

    def test_stored_status_agrees_with_predicate(self):
        """TC-030: raw stored AVAILABLE count equals the filtered total."""
        with self.engine.connect() as connection:
            rows = {row[0]: row[1] for row in connection.execute(
                text('SELECT status, COUNT(*) FROM dogs GROUP BY status')).all()}
        self.assertEqual(rows, {'AVAILABLE': 8, 'PENDING': 3, 'ADOPTED': 2})
        _, data = self._get('?available_only=true')
        self.assertEqual(data['total'], rows['AVAILABLE'])

    def test_filter_adds_no_extra_statements(self):
        """TC-070: the filter is a WHERE predicate, not an extra query."""
        def capture(query_string):
            seen = []

            def listener(conn, cursor, statement, params, context, executemany):
                seen.append(statement)

            event.listen(self.engine, 'before_cursor_execute', listener)
            try:
                self._get(query_string)
            finally:
                event.remove(self.engine, 'before_cursor_execute', listener)
            return seen

        unfiltered = capture('')
        filtered = capture('?available_only=true')
        self.assertEqual(len(filtered), len(unfiltered))
        self.assertTrue(all('WHERE' in s.upper() for s in filtered))
        self.assertFalse(any('WHERE' in s.upper() for s in unfiltered))


if __name__ == '__main__':
    unittest.main()