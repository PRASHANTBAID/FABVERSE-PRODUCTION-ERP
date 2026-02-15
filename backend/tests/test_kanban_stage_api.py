"""
Tests for Kanban drag-and-drop feature - PUT /api/lots/{lot_id}/stage endpoint
This API allows changing lot stages directly from the Kanban board
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestKanbanStageAPI:
    """Tests for PUT /api/lots/{lot_id}/stage endpoint - Kanban drag-and-drop feature"""
    
    @pytest.fixture(scope="class")
    def test_lot_id(self):
        """Get or create a test lot for stage testing"""
        # Get existing lots
        response = requests.get(f"{BASE_URL}/api/lots")
        assert response.status_code == 200
        lots = response.json()
        
        if lots:
            return lots[0]["id"]
        
        # Create a test lot if none exist
        test_lot = {
            "lot_no": "TEST-KANBAN-001",
            "cutting_date": "2026-01-15",
            "gender": "M",
            "sizes": "30x32",
            "style": "5-PKT",
            "fabric_name": "Test Fabric",
            "fabric_grade": "Fresh",
            "total_pcs_cut": 100
        }
        response = requests.post(f"{BASE_URL}/api/lots", json=test_lot)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_update_stage_to_stitching(self, test_lot_id):
        """Test updating lot stage to Stitching - status should be In Progress"""
        response = requests.put(
            f"{BASE_URL}/api/lots/{test_lot_id}/stage",
            json={"stage": "Stitching"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["current_stage"] == "Stitching"
        assert data["overall_status"] == "In Progress"
    
    def test_update_stage_to_bartack(self, test_lot_id):
        """Test updating lot stage to Bartack - status should be In Progress"""
        response = requests.put(
            f"{BASE_URL}/api/lots/{test_lot_id}/stage",
            json={"stage": "Bartack"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["current_stage"] == "Bartack"
        assert data["overall_status"] == "In Progress"
    
    def test_update_stage_to_washing_dyeing(self, test_lot_id):
        """Test updating lot stage to Washing/Dyeing - status should be In Progress"""
        response = requests.put(
            f"{BASE_URL}/api/lots/{test_lot_id}/stage",
            json={"stage": "Washing/Dyeing"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["current_stage"] == "Washing/Dyeing"
        assert data["overall_status"] == "In Progress"
    
    def test_update_stage_to_completed(self, test_lot_id):
        """Test updating lot stage to Completed - status should be Completed"""
        response = requests.put(
            f"{BASE_URL}/api/lots/{test_lot_id}/stage",
            json={"stage": "Completed"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["current_stage"] == "Completed"
        assert data["overall_status"] == "Completed"
    
    def test_update_stage_to_cutting(self, test_lot_id):
        """Test updating lot stage to Cutting - status should be Pending"""
        response = requests.put(
            f"{BASE_URL}/api/lots/{test_lot_id}/stage",
            json={"stage": "Cutting"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["current_stage"] == "Cutting"
        assert data["overall_status"] == "Pending"
    
    def test_invalid_stage_rejected(self, test_lot_id):
        """Test that invalid stage names are rejected with 400 error"""
        response = requests.put(
            f"{BASE_URL}/api/lots/{test_lot_id}/stage",
            json={"stage": "InvalidStage"}
        )
        assert response.status_code == 400
        assert "Invalid stage" in response.json()["detail"]
    
    def test_nonexistent_lot_returns_404(self):
        """Test that updating stage for non-existent lot returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/lots/non-existent-id/stage",
            json={"stage": "Cutting"}
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_stage_update_persists(self, test_lot_id):
        """Test that stage update persists when fetching lot again"""
        # Update to Bartack
        update_response = requests.put(
            f"{BASE_URL}/api/lots/{test_lot_id}/stage",
            json={"stage": "Bartack"}
        )
        assert update_response.status_code == 200
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/lots/{test_lot_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["current_stage"] == "Bartack"
        assert data["overall_status"] == "In Progress"


class TestDashboardStatsAPI:
    """Tests for dashboard stats API"""
    
    def test_dashboard_stats(self):
        """Test dashboard stats endpoint returns expected fields"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        assert "total_lots" in data
        assert "pending" in data
        assert "in_progress" in data
        assert "completed" in data
        assert isinstance(data["total_lots"], int)


class TestLotsListAPI:
    """Tests for lots listing API with stage filter"""
    
    def test_get_all_lots(self):
        """Test getting all lots"""
        response = requests.get(f"{BASE_URL}/api/lots")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_filter_lots_by_stage(self):
        """Test filtering lots by stage"""
        stages = ["Cutting", "Stitching", "Bartack", "Washing/Dyeing", "Completed"]
        for stage in stages:
            response = requests.get(f"{BASE_URL}/api/lots?stage={stage}")
            assert response.status_code == 200
            lots = response.json()
            # All returned lots should match the stage filter
            for lot in lots:
                assert lot["current_stage"] == stage, f"Expected stage {stage}, got {lot['current_stage']}"
