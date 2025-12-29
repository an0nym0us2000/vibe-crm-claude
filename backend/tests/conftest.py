"""
Pytest configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Test client fixture"""
    from app.main import app
    return TestClient(app)


@pytest.fixture
def mock_token():
    """Mock JWT token for testing"""
    return "mock_jwt_token_for_testing"


@pytest.fixture
def auth_headers(mock_token):
    """Authentication headers fixture"""
    return {"Authorization": f"Bearer {mock_token}"}


@pytest.fixture
def mock_user():
    """Mock authenticated user"""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "created_at": "2025-01-01T00:00:00Z"
    }


@pytest.fixture
def mock_workspace():
    """Mock workspace"""
    return {
        "id": "test-workspace-id",
        "name": "Test Workspace",
        "description": "Test workspace for testing",
        "owner_id": "test-user-id"
    }

