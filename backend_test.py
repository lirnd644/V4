import requests
import sys
import json
from datetime import datetime

class CripteXAPITester:
    def __init__(self, base_url="https://tradingpro-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_crypto_endpoints(self):
        """Test crypto data endpoints"""
        print("\n" + "="*50)
        print("TESTING CRYPTO DATA ENDPOINTS")
        print("="*50)
        
        # Test crypto prices
        success, data = self.run_test(
            "Get Crypto Prices",
            "GET",
            "api/crypto/prices",
            200
        )
        
        if success and data:
            print(f"   Found {len(data)} crypto currencies")
            if len(data) > 0:
                print(f"   Sample crypto: {data[0].get('symbol', 'N/A')} - ${data[0].get('current_price', 'N/A')}")
        
        # Test crypto chart data
        success, data = self.run_test(
            "Get Bitcoin Chart Data",
            "GET",
            "api/crypto/chart/bitcoin?timeframe=1h",
            200
        )
        
        if success and data:
            prices = data.get('prices', [])
            print(f"   Chart data points: {len(prices)}")

    def test_auth_endpoints_without_session(self):
        """Test authentication endpoints without valid session"""
        print("\n" + "="*50)
        print("TESTING AUTH ENDPOINTS (WITHOUT SESSION)")
        print("="*50)
        
        # Test /api/auth/me without authentication
        self.run_test(
            "Get Current User (Unauthenticated)",
            "GET",
            "api/auth/me",
            401
        )
        
        # Test logout without authentication
        self.run_test(
            "Logout (Unauthenticated)",
            "POST",
            "api/auth/logout",
            200  # Should still return 200 even if not authenticated
        )

    def test_predictions_endpoints_without_auth(self):
        """Test predictions endpoints without authentication"""
        print("\n" + "="*50)
        print("TESTING PREDICTIONS ENDPOINTS (WITHOUT AUTH)")
        print("="*50)
        
        # Test get predictions without auth
        self.run_test(
            "Get Predictions (Unauthenticated)",
            "GET",
            "api/predictions",
            401
        )
        
        # Test create prediction without auth
        self.run_test(
            "Create Prediction (Unauthenticated)",
            "POST",
            "api/predictions",
            401,
            data={
                "symbol": "BITCOIN",
                "prediction_type": "bullish",
                "timeframe": "1h",
                "target_price": 55000,
                "stop_loss": 45000
            }
        )

    def test_bonus_endpoints_without_auth(self):
        """Test bonus endpoints without authentication"""
        print("\n" + "="*50)
        print("TESTING BONUS ENDPOINTS (WITHOUT AUTH)")
        print("="*50)
        
        # Test claim bonus without auth
        self.run_test(
            "Claim Daily Bonus (Unauthenticated)",
            "POST",
            "api/bonus/claim",
            401
        )

    def test_referral_endpoints_without_auth(self):
        """Test referral endpoints without authentication"""
        print("\n" + "="*50)
        print("TESTING REFERRAL ENDPOINTS (WITHOUT AUTH)")
        print("="*50)
        
        # Test get referral stats without auth
        self.run_test(
            "Get Referral Stats (Unauthenticated)",
            "GET",
            "api/referral/stats",
            401
        )
        
        # Test use referral code without auth
        self.run_test(
            "Use Referral Code (Unauthenticated)",
            "POST",
            "api/referral/use/TESTCODE",
            401
        )

    def test_session_creation_invalid(self):
        """Test session creation with invalid data"""
        print("\n" + "="*50)
        print("TESTING SESSION CREATION (INVALID)")
        print("="*50)
        
        # Test session creation without session_id
        self.run_test(
            "Create Session (No Session ID)",
            "POST",
            "api/auth/session",
            400,
            data={}
        )
        
        # Test session creation with invalid session_id
        self.run_test(
            "Create Session (Invalid Session ID)",
            "POST",
            "api/auth/session",
            401,
            data={"session_id": "invalid_session_id"}
        )

    def test_health_check(self):
        """Test basic connectivity"""
        print("\n" + "="*50)
        print("TESTING BASIC CONNECTIVITY")
        print("="*50)
        
        try:
            response = requests.get(f"{self.base_url}/docs", timeout=10)
            if response.status_code == 200:
                print("✅ Backend is accessible - FastAPI docs available")
                self.tests_passed += 1
            else:
                print(f"❌ Backend docs not accessible - Status: {response.status_code}")
            self.tests_run += 1
        except Exception as e:
            print(f"❌ Backend not accessible - Error: {str(e)}")
            self.tests_run += 1

def main():
    print("🚀 Starting CripteX API Testing...")
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = CripteXAPITester()
    
    # Run all tests
    tester.test_health_check()
    tester.test_crypto_endpoints()
    tester.test_auth_endpoints_without_session()
    tester.test_predictions_endpoints_without_auth()
    tester.test_bonus_endpoints_without_auth()
    tester.test_referral_endpoints_without_auth()
    tester.test_session_creation_invalid()
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())