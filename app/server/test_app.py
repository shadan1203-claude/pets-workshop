import unittest
from unittest.mock import patch, MagicMock
import json
from app import app  # Changed from relative import to absolute import

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
        mock_query_instance.filter.return_value = mock_query_instance
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
    def test_get_dogs_no_filters_does_not_call_filter(self, mock_query):
        """Test that filter() is never invoked when no name/category params are provided"""
        dog = self._create_mock_dog(1, "Buddy", "Labrador")
        mock_query_instance = self._setup_query_mock(mock_query, [dog])

        response = self.app.get('/api/dogs')

        self.assertEqual(response.status_code, 200)
        mock_query_instance.filter.assert_not_called()

    @patch('app.db.session.query')
    def test_get_dogs_filter_by_name(self, mock_query):
        """Test filtering dogs by a partial, case-insensitive name match"""
        dog = self._create_mock_dog(1, "Buddy", "Golden Retriever")
        mock_query_instance = self._setup_query_mock(mock_query, [dog])

        response = self.app.get('/api/dogs?name=bud')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['dogs']), 1)
        self.assertEqual(data['dogs'][0]['name'], 'Buddy')

        mock_query_instance.filter.assert_called_once()
        filter_arg = str(mock_query_instance.filter.call_args[0][0]).lower()
        self.assertIn('dogs.name', filter_arg)
        self.assertIn('like', filter_arg)

    @patch('app.db.session.query')
    def test_get_dogs_filter_by_category(self, mock_query):
        """Test filtering dogs by category (breed name), case-insensitive"""
        dog = self._create_mock_dog(1, "Buddy", "Golden Retriever")
        mock_query_instance = self._setup_query_mock(mock_query, [dog])

        response = self.app.get('/api/dogs?category=Golden%20Retriever')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['dogs']), 1)

        mock_query_instance.filter.assert_called_once()
        filter_arg = str(mock_query_instance.filter.call_args[0][0]).lower()
        self.assertIn('breeds.name', filter_arg)

    @patch('app.db.session.query')
    def test_get_dogs_filter_combined(self, mock_query):
        """Test that name and category filters can be combined"""
        dog = self._create_mock_dog(1, "Buddy", "Golden Retriever")
        mock_query_instance = self._setup_query_mock(mock_query, [dog])

        response = self.app.get('/api/dogs?name=bud&category=Golden%20Retriever')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_query_instance.filter.call_count, 2)

    @patch('app.db.session.query')
    def test_get_dogs_filter_no_match_returns_empty(self, mock_query):
        """Test that filters returning no matches produce an empty, well-formed response"""
        mock_query_instance = self._setup_query_mock(mock_query, [])

        response = self.app.get('/api/dogs?name=nonexistent')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['dogs'], [])
        self.assertEqual(data['total'], 0)
        self.assertEqual(data['total_pages'], 1)

    @patch('app.db.session.query')
    def test_get_breeds_success(self, mock_query):
        """Test that /api/breeds returns an ordered list of breed names"""
        mock_query_instance = MagicMock()
        mock_query.return_value = mock_query_instance
        mock_query_instance.order_by.return_value = mock_query_instance

        beagle = MagicMock()
        beagle.id = 1
        beagle.name = 'Beagle'
        golden = MagicMock()
        golden.id = 2
        golden.name = 'Golden Retriever'
        mock_query_instance.all.return_value = [beagle, golden]

        response = self.app.get('/api/breeds')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['breeds'], [
            {'id': 1, 'name': 'Beagle'},
            {'id': 2, 'name': 'Golden Retriever'},
        ])

    @patch('app.db.session.query')
    def test_get_dogs_filter_by_breed_param(self, mock_query):
        """Test that the 'breed' param filters on the breed name"""
        dog = self._create_mock_dog(1, "Buddy", "Golden Retriever")
        mock_query_instance = self._setup_query_mock(mock_query, [dog])

        response = self.app.get('/api/dogs?breed=Golden%20Retriever')

        self.assertEqual(response.status_code, 200)
        mock_query_instance.filter.assert_called_once()
        self.assertIn('breeds.name', str(mock_query_instance.filter.call_args[0][0]).lower())

    @patch('app.db.session.query')
    def test_get_dogs_filter_total_pages_reflect_filter(self, mock_query):
        """Test that total and total_pages are computed from the filtered count"""
        dog = self._create_mock_dog(1, "Buddy", "Husky")
        mock_query_instance = self._setup_query_mock(mock_query, [dog])
        mock_query_instance.count.return_value = 13

        response = self.app.get('/api/dogs?breed=Husky&per_page=6')

        data = json.loads(response.data)
        self.assertEqual(data['total'], 13)
        self.assertEqual(data['total_pages'], 3)
        self.assertEqual(set(data.keys()), {'dogs', 'page', 'per_page', 'total', 'total_pages'})

    def test_get_dogs_name_too_long_returns_400(self):
        """Test that an overlong name returns 400 with an error message"""
        response = self.app.get('/api/dogs?name=' + 'a' * 101)

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', json.loads(response.data))

    def test_get_dogs_breed_too_long_returns_400(self):
        """Test that an overlong breed/category returns 400 with an error message"""
        for param in ('breed', 'category'):
            response = self.app.get(f'/api/dogs?{param}=' + 'a' * 101)
            self.assertEqual(response.status_code, 400)
            self.assertIn('error', json.loads(response.data))


if __name__ == '__main__':
    unittest.main()