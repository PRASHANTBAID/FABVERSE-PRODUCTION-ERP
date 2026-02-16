#!/usr/bin/env python3
"""
Tests for new features:
- Gender field validation (Mens, Womens, Kids only)
- Turnaround time reports API
- Delayed lots detection API
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://production-hub-78.preview.emergentagent.com')
BASE_URL = BASE_URL.rstrip('/')


class TestGenderValidation:
    """Tests for Gender field validation - only Mens, Womens, Kids allowed"""

    def test_gender_mens_accepted(self):
        """Test that 'Mens' is accepted as valid gender"""
        lot_data = {
            "lot_no": f"TEST-GENDER-MENS-{datetime.now().strftime('%H%M%S%f')}",
            "cutting_date": "2024-12-01",
            "gender": "Mens",
            "sizes": "S,M,L",
            "style": "Jogger",
            "fabric_name": "Test Fabric",
            "fabric_grade": "Fresh",
            "rolls": [{"roll_no": "1", "meters_or_kgs": 10}],
            "total_pcs_cut": 50,
            "fabric_price_per_meter_or_kg": 100
        }
        response = requests.post(f"{BASE_URL}/api/lots", json=lot_data)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}: {response.text}"
        data = response.json()
        assert data["gender"] == "Mens"
        # Cleanup
        requests.delete(f"{BASE_URL}/api/lots/{data['id']}")

    def test_gender_womens_accepted(self):
        """Test that 'Womens' is accepted as valid gender"""
        lot_data = {
            "lot_no": f"TEST-GENDER-WOMENS-{datetime.now().strftime('%H%M%S%f')}",
            "cutting_date": "2024-12-01",
            "gender": "Womens",
            "sizes": "S,M,L",
            "style": "Top",
            "fabric_name": "Test Fabric",
            "fabric_grade": "Fresh",
            "rolls": [{"roll_no": "1", "meters_or_kgs": 10}],
            "total_pcs_cut": 50,
            "fabric_price_per_meter_or_kg": 100
        }
        response = requests.post(f"{BASE_URL}/api/lots", json=lot_data)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}: {response.text}"
        data = response.json()
        assert data["gender"] == "Womens"
        # Cleanup
        requests.delete(f"{BASE_URL}/api/lots/{data['id']}")

    def test_gender_kids_accepted(self):
        """Test that 'Kids' is accepted as valid gender"""
        lot_data = {
            "lot_no": f"TEST-GENDER-KIDS-{datetime.now().strftime('%H%M%S%f')}",
            "cutting_date": "2024-12-01",
            "gender": "Kids",
            "sizes": "XS,S,M",
            "style": "Shorts",
            "fabric_name": "Test Fabric",
            "fabric_grade": "Fresh",
            "rolls": [{"roll_no": "1", "meters_or_kgs": 10}],
            "total_pcs_cut": 50,
            "fabric_price_per_meter_or_kg": 100
        }
        response = requests.post(f"{BASE_URL}/api/lots", json=lot_data)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}: {response.text}"
        data = response.json()
        assert data["gender"] == "Kids"
        # Cleanup
        requests.delete(f"{BASE_URL}/api/lots/{data['id']}")

    def test_gender_unisex_rejected(self):
        """Test that 'Unisex' is rejected as invalid gender"""
        lot_data = {
            "lot_no": f"TEST-GENDER-INVALID-{datetime.now().strftime('%H%M%S%f')}",
            "cutting_date": "2024-12-01",
            "gender": "Unisex",
            "sizes": "S,M,L",
            "style": "Jogger",
            "fabric_name": "Test Fabric",
            "fabric_grade": "Fresh",
            "rolls": [{"roll_no": "1", "meters_or_kgs": 10}],
            "total_pcs_cut": 50,
            "fabric_price_per_meter_or_kg": 100
        }
        response = requests.post(f"{BASE_URL}/api/lots", json=lot_data)
        assert response.status_code == 422, f"Expected 422 but got {response.status_code}"
        data = response.json()
        # Check error message contains gender validation error
        error_msg = str(data)
        assert "Gender must be one of" in error_msg or "gender" in error_msg.lower()

    def test_gender_male_rejected(self):
        """Test that 'Male' is rejected as invalid gender (not 'Mens')"""
        lot_data = {
            "lot_no": f"TEST-GENDER-MALE-{datetime.now().strftime('%H%M%S%f')}",
            "cutting_date": "2024-12-01",
            "gender": "Male",
            "sizes": "S,M,L",
            "style": "Jogger",
            "fabric_name": "Test Fabric",
            "fabric_grade": "Fresh",
            "rolls": [{"roll_no": "1", "meters_or_kgs": 10}],
            "total_pcs_cut": 50,
            "fabric_price_per_meter_or_kg": 100
        }
        response = requests.post(f"{BASE_URL}/api/lots", json=lot_data)
        assert response.status_code == 422, f"Expected 422 but got {response.status_code}"

    def test_gender_female_rejected(self):
        """Test that 'Female' is rejected as invalid gender (not 'Womens')"""
        lot_data = {
            "lot_no": f"TEST-GENDER-FEMALE-{datetime.now().strftime('%H%M%S%f')}",
            "cutting_date": "2024-12-01",
            "gender": "Female",
            "sizes": "S,M,L",
            "style": "Top",
            "fabric_name": "Test Fabric",
            "fabric_grade": "Fresh",
            "rolls": [{"roll_no": "1", "meters_or_kgs": 10}],
            "total_pcs_cut": 50,
            "fabric_price_per_meter_or_kg": 100
        }
        response = requests.post(f"{BASE_URL}/api/lots", json=lot_data)
        assert response.status_code == 422, f"Expected 422 but got {response.status_code}"

    def test_gender_empty_accepted(self):
        """Test that empty string gender is accepted (for backward compatibility)"""
        lot_data = {
            "lot_no": f"TEST-GENDER-EMPTY-{datetime.now().strftime('%H%M%S%f')}",
            "cutting_date": "2024-12-01",
            "gender": "",
            "sizes": "S,M,L",
            "style": "Jogger",
            "fabric_name": "Test Fabric",
            "fabric_grade": "Fresh",
            "rolls": [{"roll_no": "1", "meters_or_kgs": 10}],
            "total_pcs_cut": 50,
            "fabric_price_per_meter_or_kg": 100
        }
        response = requests.post(f"{BASE_URL}/api/lots", json=lot_data)
        # Empty string is accepted (for backward compatibility with imported data)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}"
        data = response.json()
        assert data["gender"] == ""
        # Cleanup
        requests.delete(f"{BASE_URL}/api/lots/{data['id']}")


class TestTurnaroundTimeAPI:
    """Tests for GET /api/reports/turnaround endpoint"""

    def test_turnaround_endpoint_returns_200(self):
        """Test turnaround endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/reports/turnaround")
        assert response.status_code == 200

    def test_turnaround_response_structure(self):
        """Test turnaround response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/reports/turnaround")
        assert response.status_code == 200
        data = response.json()
        
        # Check all required keys exist
        required_keys = [
            "cutting_to_stitching",
            "stitching_to_bartack",
            "bartack_to_washing",
            "washing_to_complete",
            "total_turnaround"
        ]
        for key in required_keys:
            assert key in data, f"Missing key: {key}"
        
        # Check each metric has average_days and sample_size
        for key in required_keys:
            assert "average_days" in data[key], f"{key} missing average_days"
            assert "sample_size" in data[key], f"{key} missing sample_size"

    def test_turnaround_values_are_numeric(self):
        """Test turnaround values are numeric (int or float)"""
        response = requests.get(f"{BASE_URL}/api/reports/turnaround")
        data = response.json()
        
        for metric_name, metric_data in data.items():
            avg_days = metric_data["average_days"]
            sample_size = metric_data["sample_size"]
            
            assert isinstance(avg_days, (int, float)), f"{metric_name} average_days should be numeric"
            assert isinstance(sample_size, int), f"{metric_name} sample_size should be int"
            assert avg_days >= 0, f"{metric_name} average_days should be non-negative"
            assert sample_size >= 0, f"{metric_name} sample_size should be non-negative"


class TestDelayedLotsAPI:
    """Tests for GET /api/reports/delayed endpoint"""

    def test_delayed_endpoint_returns_200(self):
        """Test delayed lots endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/reports/delayed")
        assert response.status_code == 200

    def test_delayed_endpoint_with_days_parameter(self):
        """Test delayed endpoint accepts days_threshold parameter"""
        response = requests.get(f"{BASE_URL}/api/reports/delayed?days_threshold=7")
        assert response.status_code == 200

    def test_delayed_response_structure(self):
        """Test delayed lots response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/reports/delayed?days_threshold=7")
        assert response.status_code == 200
        data = response.json()
        
        # Check required keys
        assert "threshold_days" in data, "Missing threshold_days"
        assert "total_delayed" in data, "Missing total_delayed"
        assert "delayed_lots" in data, "Missing delayed_lots"
        
        # Check types
        assert isinstance(data["threshold_days"], int)
        assert isinstance(data["total_delayed"], int)
        assert isinstance(data["delayed_lots"], list)

    def test_delayed_threshold_is_honored(self):
        """Test that the threshold_days parameter is reflected in response"""
        response = requests.get(f"{BASE_URL}/api/reports/delayed?days_threshold=14")
        data = response.json()
        assert data["threshold_days"] == 14

    def test_delayed_lots_structure_if_present(self):
        """Test that delayed lots have correct structure if any exist"""
        response = requests.get(f"{BASE_URL}/api/reports/delayed?days_threshold=1")
        data = response.json()
        
        if data["total_delayed"] > 0:
            lot = data["delayed_lots"][0]
            required_lot_fields = ["id", "lot_no", "current_stage", "days_in_stage"]
            for field in required_lot_fields:
                assert field in lot, f"Delayed lot missing field: {field}"
            
            assert isinstance(lot["days_in_stage"], int)
            assert lot["days_in_stage"] >= 1  # Should be at least threshold

    def test_delayed_default_threshold(self):
        """Test default threshold is 7 when not specified"""
        response = requests.get(f"{BASE_URL}/api/reports/delayed")
        data = response.json()
        assert data["threshold_days"] == 7


class TestReportsSummaryIntegration:
    """Test reports summary endpoint still works"""

    def test_reports_summary_endpoint(self):
        """Test reports summary endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/reports/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_lots" in data
        assert "total_pcs" in data
        assert "by_stage" in data
        assert "by_status" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
