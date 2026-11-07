import unittest
from types import SimpleNamespace
from unittest.mock import patch, MagicMock
import json
from sqlalchemy import create_engine, select
from sqlalchemy.dialects.sqlite import dialect
from app import app  # Changed from relative import to absolute import
from models import Breed

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

    def test_health_success(self):
        """Test the health check endpoint returns UP status"""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data, {"status": "UP"})


if __name__ == '__main__':
    unittest.main()