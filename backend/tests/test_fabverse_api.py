#!/usr/bin/env python3
"""
FABVERSE ERP API Tests - Backend API Testing
Tests all CRUD operations and core functionality
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fabverse-preview.preview.emergentagent.com')
BASE_URL = BASE_URL.rstrip('/')

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_login_success(self):
        """Test successful login with admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "username" in data
        assert data["username"] == "admin"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wronguser",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

class TestDashboard:
    """Dashboard stats endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_lots" in data
        assert "pending" in data
        assert "in_progress" in data
        assert "completed" in data
        assert "recent_lots" in data

class TestLotsCRUD:
    """Lot CRUD operations tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.test_lot_id = None
    
    def test_create_lot(self):
        """Test creating a new lot"""
        lot_data = {
            "lot_no": f"TEST-PYTEST-{datetime.now().strftime('%H%M%S')}",
            "cutting_date": "2024-12-01",
            "gender": "Male",
            "sizes": "S, M, L",
            "style": "Test Jogger",
            "fabric_name": "Test Fabric",
            "fabric_grade": "Fresh",
            "dyeing_or_washing_instructions": "Test wash",
            "rolls": [{"roll_no": "1", "meters_or_kgs": 50.0}],
            "total_pcs_cut": 100,
            "fabric_price_per_meter_or_kg": 100.0,
            "cutting_notes": "Test notes"
        }
        response = requests.post(f"{BASE_URL}/api/lots", json=lot_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["lot_no"] == lot_data["lot_no"]
        assert data["total_pcs_cut"] == lot_data["total_pcs_cut"]
        
        # Store for cleanup
        self.test_lot_id = data["id"]
        
        # GET to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/lots/{self.test_lot_id}", headers=self.headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["lot_no"] == lot_data["lot_no"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/lots/{self.test_lot_id}", headers=self.headers)
    
    def test_get_all_lots(self):
        """Test getting all lots"""
        response = requests.get(f"{BASE_URL}/api/lots", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_lots_with_search(self):
        """Test getting lots with search filter"""
        response = requests.get(f"{BASE_URL}/api/lots?search=1253", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_lots_with_stage_filter(self):
        """Test getting lots with stage filter"""
        response = requests.get(f"{BASE_URL}/api/lots?stage=Stitching", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

class TestChallans:
    """Challan endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_all_challans(self):
        """Test getting all challans"""
        response = requests.get(f"{BASE_URL}/api/challans", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify challan structure
        if len(data) > 0:
            challan = data[0]
            assert "challan_id" in challan
            assert "challan_type" in challan
            assert "challan_number" in challan
            assert "lot_id" in challan
    
    def test_get_challans_by_type(self):
        """Test filtering challans by type"""
        # Test Stitching filter
        response = requests.get(f"{BASE_URL}/api/challans?challan_type=Stitching", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for challan in data:
            assert challan["challan_type"] == "Stitching"
        
        # Test Washing filter
        response = requests.get(f"{BASE_URL}/api/challans?challan_type=Washing", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for challan in data:
            assert challan["challan_type"] == "Washing"

class TestReports:
    """Reports endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_reports_summary(self):
        """Test reports summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/reports/summary", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_lots" in data
        assert "total_pcs" in data
        assert "by_stage" in data
        assert "by_status" in data

class TestExcelExport:
    """Excel export endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_excel_export(self):
        """Test Excel export endpoint"""
        response = requests.get(f"{BASE_URL}/api/export/excel", headers=self.headers)
        assert response.status_code == 200
        assert response.headers.get('content-type').startswith('application/vnd.openxmlformats')

class TestFirmSettings:
    """Firm settings endpoint tests"""
    
    def test_get_firm_settings(self):
        """Test getting firm settings"""
        response = requests.get(f"{BASE_URL}/api/settings/firm")
        assert response.status_code == 200
        data = response.json()
        assert "firm_name" in data
        assert data["firm_name"] == "FABVERSE"

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
