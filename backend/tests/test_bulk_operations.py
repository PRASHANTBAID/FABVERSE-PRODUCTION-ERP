"""
Test suite for Bulk Operations API - Testing bulk delete, bulk status change, and bulk stage change
Features being tested:
1. POST /api/lots/bulk-delete - Delete multiple lots at once
2. POST /api/lots/bulk-status - Change status for multiple lots
3. POST /api/lots/bulk-stage - Change stage for multiple lots
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestBulkOperationsAPI:
    """Test bulk operations endpoints for lots"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token, create test lots"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Create test lots for bulk operations
        self.test_lot_ids = []
        for i in range(3):
            lot_response = self.session.post(f"{BASE_URL}/api/lots", json={
                "lot_no": f"TEST_BULK_{i}_{os.urandom(4).hex()}",
                "cutting_date": "2026-02-17",
                "gender": "Mens",
                "sizes": "30,32,34",
                "style": "Test Style",
                "fabric_name": "Test Fabric",
                "fabric_grade": "Fresh",
                "total_pcs_cut": 100 + i * 10,
                "rolls": []
            })
            if lot_response.status_code == 200:
                self.test_lot_ids.append(lot_response.json()["id"])
        
        yield
        
        # Cleanup: Delete test lots
        for lot_id in self.test_lot_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/lots/{lot_id}")
            except:
                pass

    # ==================== BULK STATUS TESTS ====================

    def test_bulk_status_change_to_in_progress(self):
        """Test changing status to 'In Progress' for multiple lots"""
        if len(self.test_lot_ids) < 2:
            pytest.skip("Not enough test lots created")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-status", json={
            "lot_ids": self.test_lot_ids[:2],
            "status": "In Progress"
        })
        
        assert response.status_code == 200, f"Bulk status change failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "updated_count" in data
        assert data["updated_count"] == 2
        print(f"PASS: Bulk status change to 'In Progress' - {data['message']}")

    def test_bulk_status_change_to_completed(self):
        """Test changing status to 'Completed' for multiple lots"""
        if len(self.test_lot_ids) < 2:
            pytest.skip("Not enough test lots created")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-status", json={
            "lot_ids": self.test_lot_ids[:2],
            "status": "Completed"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] >= 0
        print(f"PASS: Bulk status change to 'Completed' - {data['message']}")

    def test_bulk_status_change_to_delayed(self):
        """Test changing status to 'Delayed' for multiple lots"""
        if len(self.test_lot_ids) < 1:
            pytest.skip("Not enough test lots created")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-status", json={
            "lot_ids": [self.test_lot_ids[0]],
            "status": "Delayed"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] >= 0
        print(f"PASS: Bulk status change to 'Delayed' - {data['message']}")

    def test_bulk_status_invalid_status(self):
        """Test that invalid status returns 400 error"""
        if len(self.test_lot_ids) < 1:
            pytest.skip("Not enough test lots created")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-status", json={
            "lot_ids": [self.test_lot_ids[0]],
            "status": "InvalidStatus"
        })
        
        assert response.status_code == 400, f"Expected 400 for invalid status, got {response.status_code}"
        print("PASS: Invalid status returns 400 error")

    def test_bulk_status_empty_lot_ids(self):
        """Test that empty lot_ids array returns 400 error"""
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-status", json={
            "lot_ids": [],
            "status": "In Progress"
        })
        
        assert response.status_code == 400
        print("PASS: Empty lot_ids returns 400 error")

    def test_bulk_status_requires_auth(self):
        """Test that bulk status change requires authentication"""
        # Create new session without auth
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        response = no_auth_session.post(f"{BASE_URL}/api/lots/bulk-status", json={
            "lot_ids": ["some-id"],
            "status": "In Progress"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Bulk status requires authentication (401)")

    # ==================== BULK STAGE TESTS ====================

    def test_bulk_stage_change_to_stitching(self):
        """Test changing stage to 'Stitching' for multiple lots"""
        if len(self.test_lot_ids) < 2:
            pytest.skip("Not enough test lots created")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-stage", json={
            "lot_ids": self.test_lot_ids[:2],
            "stage": "Stitching"
        })
        
        assert response.status_code == 200, f"Bulk stage change failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "updated_count" in data
        print(f"PASS: Bulk stage change to 'Stitching' - {data['message']}")

    def test_bulk_stage_change_to_bartack(self):
        """Test changing stage to 'Bartack' for multiple lots"""
        if len(self.test_lot_ids) < 1:
            pytest.skip("Not enough test lots created")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-stage", json={
            "lot_ids": [self.test_lot_ids[0]],
            "stage": "Bartack"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] >= 0
        print(f"PASS: Bulk stage change to 'Bartack' - {data['message']}")

    def test_bulk_stage_change_to_washing(self):
        """Test changing stage to 'Washing/Dyeing' for multiple lots"""
        if len(self.test_lot_ids) < 1:
            pytest.skip("Not enough test lots created")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-stage", json={
            "lot_ids": [self.test_lot_ids[0]],
            "stage": "Washing/Dyeing"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] >= 0
        print(f"PASS: Bulk stage change to 'Washing/Dyeing' - {data['message']}")

    def test_bulk_stage_change_to_completed(self):
        """Test changing stage to 'Completed' for multiple lots"""
        if len(self.test_lot_ids) < 1:
            pytest.skip("Not enough test lots created")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-stage", json={
            "lot_ids": [self.test_lot_ids[0]],
            "stage": "Completed"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify the status was also updated to Completed
        lot_response = self.session.get(f"{BASE_URL}/api/lots/{self.test_lot_ids[0]}")
        if lot_response.status_code == 200:
            lot_data = lot_response.json()
            assert lot_data["overall_status"] == "Completed", "Stage 'Completed' should set status to 'Completed'"
        
        print(f"PASS: Bulk stage change to 'Completed' - {data['message']}")

    def test_bulk_stage_invalid_stage(self):
        """Test that invalid stage returns 400 error"""
        if len(self.test_lot_ids) < 1:
            pytest.skip("Not enough test lots created")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-stage", json={
            "lot_ids": [self.test_lot_ids[0]],
            "stage": "InvalidStage"
        })
        
        assert response.status_code == 400, f"Expected 400 for invalid stage, got {response.status_code}"
        print("PASS: Invalid stage returns 400 error")

    def test_bulk_stage_empty_lot_ids(self):
        """Test that empty lot_ids array returns 400 error"""
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-stage", json={
            "lot_ids": [],
            "stage": "Stitching"
        })
        
        assert response.status_code == 400
        print("PASS: Empty lot_ids returns 400 error for stage")

    def test_bulk_stage_requires_auth(self):
        """Test that bulk stage change requires authentication"""
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        response = no_auth_session.post(f"{BASE_URL}/api/lots/bulk-stage", json={
            "lot_ids": ["some-id"],
            "stage": "Stitching"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Bulk stage requires authentication (401)")

    # ==================== BULK DELETE TESTS ====================

    def test_bulk_delete_multiple_lots(self):
        """Test deleting multiple lots at once"""
        # Create specific lots for deletion test
        delete_lot_ids = []
        for i in range(2):
            lot_response = self.session.post(f"{BASE_URL}/api/lots", json={
                "lot_no": f"TEST_DELETE_{i}_{os.urandom(4).hex()}",
                "cutting_date": "2026-02-17",
                "gender": "Mens",
                "sizes": "30,32",
                "style": "Delete Test",
                "fabric_name": "Delete Fabric",
                "total_pcs_cut": 50,
                "rolls": []
            })
            if lot_response.status_code == 200:
                delete_lot_ids.append(lot_response.json()["id"])
        
        if len(delete_lot_ids) < 2:
            pytest.skip("Could not create test lots for deletion")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-delete", json={
            "lot_ids": delete_lot_ids
        })
        
        assert response.status_code == 200, f"Bulk delete failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "deleted_count" in data
        assert data["deleted_count"] == 2
        
        # Verify lots are actually deleted
        for lot_id in delete_lot_ids:
            get_response = self.session.get(f"{BASE_URL}/api/lots/{lot_id}")
            assert get_response.status_code == 404, f"Lot {lot_id} should be deleted"
        
        print(f"PASS: Bulk delete - {data['message']}")

    def test_bulk_delete_empty_lot_ids(self):
        """Test that empty lot_ids array returns 400 error"""
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-delete", json={
            "lot_ids": []
        })
        
        assert response.status_code == 400
        print("PASS: Empty lot_ids returns 400 error for delete")

    def test_bulk_delete_requires_auth(self):
        """Test that bulk delete requires authentication"""
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        response = no_auth_session.post(f"{BASE_URL}/api/lots/bulk-delete", json={
            "lot_ids": ["some-id"]
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Bulk delete requires authentication (401)")

    def test_bulk_delete_nonexistent_lots(self):
        """Test bulk delete with non-existent lot IDs"""
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-delete", json={
            "lot_ids": ["nonexistent-id-1", "nonexistent-id-2"]
        })
        
        assert response.status_code == 200  # Should succeed but with 0 deleted
        data = response.json()
        assert data["deleted_count"] == 0
        print("PASS: Bulk delete with non-existent IDs returns 0 deleted")

    # ==================== VERIFY STATUS/STAGE UPDATES ====================

    def test_bulk_stage_cutting_sets_pending_status(self):
        """Test that setting stage to 'Cutting' sets status to 'Pending'"""
        if len(self.test_lot_ids) < 1:
            pytest.skip("Not enough test lots created")
        
        # First change to something else
        self.session.post(f"{BASE_URL}/api/lots/bulk-stage", json={
            "lot_ids": [self.test_lot_ids[0]],
            "stage": "Stitching"
        })
        
        # Now change back to Cutting
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-stage", json={
            "lot_ids": [self.test_lot_ids[0]],
            "stage": "Cutting"
        })
        
        assert response.status_code == 200
        
        # Verify status is Pending
        lot_response = self.session.get(f"{BASE_URL}/api/lots/{self.test_lot_ids[0]}")
        if lot_response.status_code == 200:
            lot_data = lot_response.json()
            assert lot_data["overall_status"] == "Pending", "Stage 'Cutting' should set status to 'Pending'"
            assert lot_data["current_stage"] == "Cutting"
        
        print("PASS: Stage 'Cutting' sets status to 'Pending'")

    def test_bulk_stage_stitching_sets_in_progress_status(self):
        """Test that setting stage to 'Stitching' sets status to 'In Progress'"""
        if len(self.test_lot_ids) < 1:
            pytest.skip("Not enough test lots created")
        
        response = self.session.post(f"{BASE_URL}/api/lots/bulk-stage", json={
            "lot_ids": [self.test_lot_ids[0]],
            "stage": "Stitching"
        })
        
        assert response.status_code == 200
        
        # Verify status is In Progress
        lot_response = self.session.get(f"{BASE_URL}/api/lots/{self.test_lot_ids[0]}")
        if lot_response.status_code == 200:
            lot_data = lot_response.json()
            assert lot_data["overall_status"] == "In Progress", "Stage 'Stitching' should set status to 'In Progress'"
            assert lot_data["current_stage"] == "Stitching"
        
        print("PASS: Stage 'Stitching' sets status to 'In Progress'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
