"""
Tests for Project Management API
"""
import pytest

class TestProjectManagement:
    """Test project management endpoints"""

    def test_list_projects(self, client, auth_headers):
        """Test listing projects"""
        response = client.get("/api/v1/projects", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Should have at least the default project created on first load if empty
        if len(data) > 0:
            assert "id" in data[0]
            assert "name" in data[0]

    def test_create_project(self, client, auth_headers):
        """Test creating a new project"""
        project_data = {
            "name": "Integration Test Project",
            "description": "Created during automated testing"
        }
        
        response = client.post("/api/v1/projects", 
                             headers=auth_headers, 
                             json=project_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == project_data["name"]
        assert "id" in data
        
        return data["id"]

    def test_get_project_by_id(self, client, auth_headers):
        """Test retrieving specific project"""
        # Create one first
        create_res = client.post("/api/v1/projects", 
                               headers=auth_headers, 
                               json={"name": "Lookup Project"})
        project_id = create_res.json()["id"]
        
        # Get it
        response = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project_id
        assert data["name"] == "Lookup Project"

    def test_get_project_not_found(self, client, auth_headers):
        """Test 404 for non-existent project"""
        response = client.get("/api/v1/projects/non_existent_id_999", headers=auth_headers)
        assert response.status_code == 404
