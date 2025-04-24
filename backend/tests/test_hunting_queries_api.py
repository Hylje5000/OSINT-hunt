"""
Tests for the Hunting Queries API endpoints.
"""
import json
import pytest
from app import create_app
from models import db, Report, HuntingQuery
from config import TestConfig


@pytest.fixture
def app():
    """Create and configure a Flask app for testing"""
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
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


def test_generate_ioc_query(client, test_data):
    """Test generating a hunting query for a specific IoC value"""
    ioc_value = "example.com"
    payload = {
        "ioc_type": "domain",
        "query_name": "Test Query",
        "description": "Test description"
    }
    
    response = client.post(f'/api/iocs/{ioc_value}/generate_query', 
                         json=payload,
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert "hunting_query" in data
    assert data["hunting_query"]["ioc_value"] == ioc_value
    assert data["hunting_query"]["ioc_type"] == "domain"
    assert data["hunting_query"]["query_type"] == "kql"
    assert "query_text" in data["hunting_query"]
    
    # Verify the query was saved to the database
    with client.application.app_context():
        query = HuntingQuery.query.filter_by(ioc_value=ioc_value).first()
        assert query is not None
        assert query.name == "Test Query"


def test_get_ioc_hunting_queries(client, app):
    """Test retrieving hunting queries for a specific IoC"""
    # First create a query for an IoC
    ioc_value = "example.com"
    
    with app.app_context():
        query = HuntingQuery(
            name="Test Query",
            description="Test Description",
            query_type="kql",
            query_text=json.dumps({"table": "SecurityEvent | where Computer contains 'example.com'"}),
            ioc_value=ioc_value,
            ioc_type="domain",
            iocs=[{"type": "domain", "value": ioc_value}]
        )
        db.session.add(query)
        db.session.commit()
    
    # Now retrieve the queries for this IoC
    response = client.get(f'/api/iocs/{ioc_value}/hunting_queries')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert "hunting_queries" in data
    assert len(data["hunting_queries"]) == 1
    assert data["hunting_queries"][0]["ioc_value"] == ioc_value


def test_generate_multiple_ioc_queries(client):
    """Test generating hunting queries for multiple IoCs"""
    payload = {
        "iocs": [
            {"type": "domain", "value": "example.com", "description": "Test domain"},
            {"type": "ip_address", "value": "192.168.1.1", "description": "Test IP"}
        ],
        "save": True,
        "generate_individual_queries": True,
        "query_name": "Test Multiple Query",
        "description": "Test multiple query description"
    }
    
    response = client.post('/api/iocs/generate_queries', 
                         json=payload,
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert "hunting_queries" in data
    assert "iocs_processed" in data
    assert len(data["iocs_processed"]) == 2
    
    # Check that individual queries were created
    assert "saved_individual_queries" in data
    assert len(data["saved_individual_queries"]) == 2
    
    # Verify in database
    with client.application.app_context():
        queries = HuntingQuery.query.all()
        assert len(queries) >= 2  # Should have at least 2 queries


def test_generate_queries_for_report(client, test_data):
    """Test generating hunting queries for IoCs in a report"""
    payload = {
        "generate_individual_queries": True,
        "save": True
    }
    
    response = client.post(f'/api/reports/{test_data["report_id"]}/generate_queries', 
                         json=payload,
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert "hunting_queries" in data
    assert "iocs_processed" in data
    assert len(data["iocs_processed"]) == 2
    
    # Check that individual queries were created
    assert "saved_individual_queries" in data
    assert len(data["saved_individual_queries"]) == 2
    
    # Verify that queries are linked to the report
    with client.application.app_context():
        report_queries = HuntingQuery.query.filter_by(report_id=test_data["report_id"]).all()
        assert len(report_queries) == 2


def test_delete_hunting_query(client, app):
    """Test deleting a hunting query"""
    # First create a query
    with app.app_context():
        query = HuntingQuery(
            name="Delete Test Query",
            description="Test Description",
            query_type="kql",
            query_text=json.dumps({"table": "SecurityEvent | where Computer contains 'example.com'"}),
            ioc_value="example.com",
            ioc_type="domain"
        )
        db.session.add(query)
        db.session.commit()
        query_id = query.id
    
    # Now delete it
    response = client.delete(f'/api/hunting_queries/{query_id}')
    
    assert response.status_code == 200
    
    # Verify it's gone from the database
    with app.app_context():
        deleted_query = HuntingQuery.query.get(query_id)
        assert deleted_query is None