import json
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from sqlalchemy import create_engine, select
from sqlalchemy.dialects.sqlite import dialect

from app import app
from models import Breed


class TestBreedSearch(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        app.config['TESTING'] = True

    @patch('app.db.session.query')
    def test_dog_list_filters_by_breed_before_pagination(self, mock_query):
        query = MagicMock()
        mock_query.return_value = query
        query.join.return_value = query
        query.filter.return_value = query
        query.count.return_value = 1
        query.offset.return_value = query
        query.limit.return_value = query
        query.all.return_value = [
            SimpleNamespace(id=1, name='Buddy', breed='Golden Retriever')
        ]

        response = self.client.get('/api/dogs?breed=Golden%20Retriever&page=2')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['dogs'][0]['breed'], 'Golden Retriever')
        self.assertEqual(data['total'], 1)
        query.filter.assert_called_once()
        query.offset.assert_called_once_with(6)

    @patch('app.db.session.query')
    def test_breed_filter_escapes_like_wildcards(self, mock_query):
        query = MagicMock()
        mock_query.return_value = query
        query.join.return_value = query
        query.filter.return_value = query
        query.count.return_value = 0
        query.offset.return_value = query
        query.limit.return_value = query
        query.all.return_value = []

        breed_names = ['P%up', 'P_up', r'P\up', 'Pup', 'P-up']
        engine = create_engine('sqlite://')
        Breed.__table__.create(engine)
        with engine.begin() as connection:
            connection.execute(
                Breed.__table__.insert(),
                [{'name': name} for name in breed_names],
            )

        with engine.connect() as connection:
            for breed_name in ('P%up', 'P_up', r'P\up'):
                with self.subTest(breed=breed_name):
                    response = self.client.get(
                        '/api/dogs',
                        query_string={'breed': breed_name},
                    )
                    self.assertEqual(response.status_code, 200)
                    expression = query.filter.call_args.args[0]
                    compiled = expression.compile(dialect=dialect())
                    self.assertIn('ESCAPE', str(compiled).upper())
                    matches = connection.execute(
                        select(Breed.name).where(expression).order_by(Breed.name)
                    ).scalars().all()
                    self.assertEqual(matches, [breed_name])

        engine.dispose()

    @patch('app.db.session.query')
    def test_breed_catalog_is_sorted_by_name(self, mock_query):
        query = MagicMock()
        mock_query.return_value = query
        query.order_by.return_value = query
        query.all.return_value = [
            SimpleNamespace(id=1, name='Golden Retriever'),
            SimpleNamespace(id=2, name='Husky'),
        ]

        response = self.client.get('/api/breeds')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.data),
            [
                {'id': 1, 'name': 'Golden Retriever'},
                {'id': 2, 'name': 'Husky'},
            ],
        )
        query.order_by.assert_called_once()


if __name__ == '__main__':
    unittest.main()
