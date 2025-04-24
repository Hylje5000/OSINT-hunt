import pytest
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app import create_app
from models import db, Report, HuntingQuery
from config import TestConfig


@pytest.fixture
def app():
    """Create and configure a Flask app for testing"""
    # Override environment variables to prevent connecting to the real database
    os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    # Create the Flask app with the test configuration
    app = create_app(TestConfig)
    
    with app.app_context():
        # Create all tables in the in-memory database
        db.create_all()
        yield app
        # Clean up after the test
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app"""
    return app.test_client()


@pytest.fixture
def test_data(app):
    """Create test data for the tests"""
    with app.app_context():
        # Create a test report
        report = Report(name="Test Report", source="Unit Test")
        
        # Add some IoCs to the report
        report.set_iocs([
            {"type": "domain", "value": "example.com", "description": "Test domain"},
            {"type": "ip_address", "value": "192.168.1.1", "description": "Test IP"}
        ])
        
        db.session.add(report)
        db.session.commit()
        
        return {"report_id": report.id}