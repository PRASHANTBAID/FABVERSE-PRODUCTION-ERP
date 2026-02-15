#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FabverseAPITester:
    def __init__(self, base_url="https://fresh-start-208.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.text else {}
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")

            self.test_results.append({
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success,
                'response_text': response.text[:200] if response.text else ''
            })

            return success, response.json() if success and response.text else {}

        except requests.exceptions.RequestException as e:
            print(f"❌ FAILED - Network Error: {str(e)}")
            self.test_results.append({
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'actual_status': 'ERROR',
                'success': False,
                'response_text': str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test API health"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "/health",
            200,
            auth_required=False
        )
        return success

    def test_login(self, username="admin", password="admin"):
        """Test login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/auth/login",
            200,
            data={"username": username, "password": password},
            auth_required=False
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   🔑 Token acquired: {self.token[:50]}...")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "/dashboard/stats",
            200
        )
        return success

    def test_create_lot(self):
        """Create a test lot"""
        test_lot_data = {
            "lot_no": f"TEST-{datetime.now().strftime('%H%M%S')}",
            "cutting_date": "2024-12-01",
            "gender": "Male",
            "sizes": "S, M, L, XL",
            "style": "Jogger",
            "fabric_name": "Rome Black",
            "fabric_grade": "Fresh",
            "dyeing_or_washing_instructions": "Light wash",
            "rolls": [
                {"roll_no": "1", "meters_or_kgs": 50.5},
                {"roll_no": "2", "meters_or_kgs": 45.0}
            ],
            "total_pcs_cut": 100,
            "fabric_price_per_meter_or_kg": 150.0,
            "cutting_notes": "Test cutting notes"
        }

        success, response = self.run_test(
            "Create Test Lot",
            "POST",
            "/lots",
            200,  # Backend returns 200 not 201
            data=test_lot_data
        )
        
        if success and 'id' in response:
            self.test_lot_id = response['id']
            print(f"   📦 Test lot created with ID: {self.test_lot_id}")
            return response
        return None

    def test_get_lots(self):
        """Test get all lots"""
        success, response = self.run_test(
            "Get All Lots",
            "GET",
            "/lots",
            200
        )
        return success

    def test_get_lot_detail(self, lot_id):
        """Test get lot by ID"""
        success, response = self.run_test(
            "Get Lot Detail",
            "GET",
            f"/lots/{lot_id}",
            200
        )
        return success, response

    def test_create_stitching_stage(self, lot_id):
        """Create stitching stage"""
        stitching_data = {
            "lot_id": lot_id,
            "stitching_fabricator_name": "Test Fabricator",
            "lot_issue_date_to_stitching": "2024-12-02",
            "stitching_notes": "Test stitching notes"
        }

        success, response = self.run_test(
            "Create Stitching Stage",
            "POST",
            "/stitching",
            200,  # Backend returns 200 not 201
            data=stitching_data
        )
        
        if success and 'stitching_challan_no' in response:
            self.stitching_challan_no = response['stitching_challan_no']
            print(f"   📋 Stitching challan generated: {self.stitching_challan_no}")
        
        return success, response

    def test_create_bartack_stage(self, lot_id):
        """Create bartack stage"""
        bartack_data = {
            "lot_id": lot_id,
            "bartack_person_name": "Test Bartack Person",
            "lot_issue_to_bartack_date": "2024-12-03",
            "pcs_issued_to_bartack": 100,
            "bartack_notes": "Test bartack notes"
        }

        success, response = self.run_test(
            "Create Bartack Stage",
            "POST",
            "/bartack",
            201,
            data=bartack_data
        )
        
        return success, response

    def test_create_washing_stage(self, lot_id):
        """Create washing stage"""
        washing_data = {
            "lot_id": lot_id,
            "dyeing_person_firm_name": "Test Washing Firm",
            "lot_issue_date_to_washing": "2024-12-04",
            "pcs_issued_to_washing": 100,
            "washing_notes": "Test washing notes"
        }

        success, response = self.run_test(
            "Create Washing Stage",
            "POST",
            "/washing",
            201,
            data=washing_data
        )
        
        if success and 'washing_challan_no' in response:
            self.washing_challan_no = response['washing_challan_no']
            print(f"   📋 Washing challan generated: {self.washing_challan_no}")
        
        return success, response

    def test_get_challans(self):
        """Test get challans"""
        success, response = self.run_test(
            "Get All Challans",
            "GET",
            "/challans",
            200
        )
        return success

    def test_reports_summary(self):
        """Test reports summary endpoint"""
        success, response = self.run_test(
            "Reports Summary",
            "GET",
            "/reports/summary",
            200
        )
        return success

    def test_change_password(self):
        """Test password change functionality"""
        # First change to new password
        change_data = {
            "old_password": "admin",
            "new_password": "newpass123"
        }

        success1, response1 = self.run_test(
            "Change Password (Step 1)",
            "POST",
            "/auth/change-password",
            200,
            data=change_data
        )

        if success1:
            # Test login with new password
            success2, response2 = self.run_test(
                "Login with New Password",
                "POST",
                "/auth/login",
                200,
                data={"username": "admin", "password": "newpass123"},
                auth_required=False
            )

            if success2 and 'token' in response2:
                self.token = response2['token']
                
                # Change back to original password
                change_back_data = {
                    "old_password": "newpass123",
                    "new_password": "admin"
                }

                success3, response3 = self.run_test(
                    "Change Password Back to Original",
                    "POST",
                    "/auth/change-password",
                    200,
                    data=change_back_data
                )

                return success3
        
        return False

    def test_excel_export(self):
        """Test Excel export endpoint"""
        success, response = self.run_test(
            "Excel Export",
            "GET",
            "/export/excel",
            200
        )
        return success

    def cleanup_test_data(self):
        """Clean up test data"""
        if hasattr(self, 'test_lot_id'):
            success, response = self.run_test(
                "Delete Test Lot",
                "DELETE",
                f"/lots/{self.test_lot_id}",
                200
            )
            if success:
                print(f"   🗑️ Test lot {self.test_lot_id} deleted")

def main():
    print("🚀 Starting FABVERSE ERP API Tests")
    print("="*60)
    
    tester = FabverseAPITester()
    
    # Test sequence
    try:
        # Basic connectivity
        if not tester.test_health_check():
            print("❌ Health check failed - stopping tests")
            return 1
            
        # Authentication
        if not tester.test_login():
            print("❌ Login failed - stopping tests")
            return 1

        # Dashboard
        tester.test_dashboard_stats()

        # Lot management
        test_lot = tester.test_create_lot()
        if not test_lot:
            print("❌ Failed to create test lot - skipping stage tests")
        else:
            lot_id = test_lot['id']
            
            # Test lot retrieval
            tester.test_get_lots()
            tester.test_get_lot_detail(lot_id)
            
            # Test production stages
            tester.test_create_stitching_stage(lot_id)
            tester.test_create_bartack_stage(lot_id)
            tester.test_create_washing_stage(lot_id)
            
            # Test challans
            tester.test_get_challans()

        # Reports and analytics
        tester.test_reports_summary()
        
        # Excel export
        tester.test_excel_export()
        
        # Test authentication features
        tester.test_change_password()

    except KeyboardInterrupt:
        print("\n⏹️ Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
    finally:
        # Cleanup
        tester.cleanup_test_data()

    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"📋 Total Tests: {tester.tests_run}")
    print(f"✅ Passed: {tester.tests_passed}")
    print(f"❌ Failed: {tester.tests_run - tester.tests_passed}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    # List failed tests
    failed_tests = [test for test in tester.test_results if not test['success']]
    if failed_tests:
        print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test['name']}: {test['actual_status']} (expected {test['expected_status']})")
            if test['response_text']:
                print(f"     Error: {test['response_text']}")
    else:
        print(f"\n🎉 ALL TESTS PASSED!")

    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())