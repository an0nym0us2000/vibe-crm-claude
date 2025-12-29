"""
Basic API Tests
Tests for core API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

# Create test client
client = TestClient(app)


class TestHealthCheck:
    """Test health check endpoints"""
    
    def test_ping(self):
        """Test ping endpoint"""
        response = client.get("/api/v1/ping")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "pong" in data["data"]["message"].lower()
    
    def test_health(self):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200


class TestAIConfig:
    """Test AI configuration endpoints"""
    
    def test_get_templates(self):
        """Test get industry templates"""
        response = client.get("/api/v1/ai/templates")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "templates" in data["data"]
        assert len(data["data"]["templates"]) > 0
    
    def test_preview_generation(self):
        """Test AI config preview (no auth required)"""
        response = client.post(
            "/api/v1/ai/preview",
            json={
                "business_description": "Real estate agency managing properties and clients"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "config" in data["data"]
        assert len(data["data"]["config"]["entities"]) > 0


class TestAuthentication:
    """Test authentication flows (mocked)"""
    
    def test_unauthenticated_access(self):
        """Test that protected endpoints require auth"""
        response = client.get("/api/v1/workspaces")
        # Should return 401 or redirect
        assert response.status_code in [401, 403]
    
    def test_invalid_token(self):
        """Test invalid token handling"""
        response = client.get(
            "/api/v1/workspaces",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code in [401, 403]


class TestWorkspaces:
    """Test workspace endpoints (integration tests would require real auth)"""
    
    def test_workspace_creation_requires_auth(self):
        """Test that workspace creation requires authentication"""
        response = client.post(
            "/api/v1/workspaces",
            json={
                "name": "Test Workspace",
                "description": "Test description"
            }
        )
        assert response.status_code in [401, 403]


class TestErrorHandling:
    """Test error handling"""
    
    def test_404_handling(self):
        """Test 404 error"""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404
    
    def test_validation_error(self):
        """Test validation error on invalid data"""
        response = client.post(
            "/api/v1/ai/preview",
            json={}  # Missing required field
        )
        assert response.status_code == 422


# Pytest configuration
@pytest.fixture
def mock_user():
    """Mock authenticated user"""
    return {
        "id": "test-user-id",
        "email": "test@example.com"
    }


@pytest.fixture
def auth_headers(mock_user):
    """Mock authentication headers"""
    # In real tests, this would be a real JWT token
    return {
        "Authorization": "Bearer mock_token_for_testing"
    }


# Run tests with: pytest backend/tests/test_api.py -v
