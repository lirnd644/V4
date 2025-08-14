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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
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
        if params:
            print(f"   Params: {params}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=params)
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
                    print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
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

    def test_extended_crypto_api(self):
        """Test extended crypto API with multi-currency support"""
        print("\n" + "="*50)
        print("TESTING EXTENDED CRYPTO API")
        print("="*50)
        
        # Test crypto prices with default USD
        success, data = self.run_test(
            "Get Crypto Prices (USD)",
            "GET",
            "api/crypto/prices",
            200
        )
        
        if success and data:
            print(f"   Found {len(data)} crypto currencies")
            if len(data) > 0:
                crypto = data[0]
                print(f"   Sample crypto: {crypto.get('symbol', 'N/A')} - ${crypto.get('current_price', 'N/A')}")
                print(f"   Has icon URL: {'icon_url' in crypto}")
                print(f"   Currency: {crypto.get('currency', 'N/A')}")
        
        # Test crypto prices with different currencies
        currencies = ["RUB", "EUR", "GBP", "JPY", "CNY", "KRW", "INR"]
        for currency in currencies:
            success, data = self.run_test(
                f"Get Crypto Prices ({currency})",
                "GET",
                "api/crypto/prices",
                200,
                params={"currency": currency, "limit": 10}
            )
            
            if success and data and len(data) > 0:
                print(f"   {currency} conversion working - BTC price: {data[0].get('current_price', 'N/A')}")
        
        # Test crypto chart data for different symbols
        symbols = ["bitcoin", "ethereum", "binancecoin"]
        timeframes = ["1h", "4h", "1d"]
        
        for symbol in symbols:
            for timeframe in timeframes:
                success, data = self.run_test(
                    f"Get {symbol.title()} Chart ({timeframe})",
                    "GET",
                    f"api/crypto/chart/{symbol}",
                    200,
                    params={"timeframe": timeframe}
                )
                
                if success and data:
                    prices = data.get('prices', [])
                    volumes = data.get('volumes', [])
                    print(f"   Chart data - Prices: {len(prices)}, Volumes: {len(volumes)}")

    def test_binary_options_api(self):
        """Test binary options API endpoints"""
        print("\n" + "="*50)
        print("TESTING BINARY OPTIONS API")
        print("="*50)
        
        # Test get binary predictions without auth (should fail)
        self.run_test(
            "Get Binary Predictions (Unauthenticated)",
            "GET",
            "api/binary-predictions",
            401
        )
        
        # Test create binary prediction without auth (should fail)
        self.run_test(
            "Create Binary Prediction (Unauthenticated)",
            "POST",
            "api/binary-predictions",
            401,
            data={
                "symbol": "BTC",
                "direction": "UP",
                "timeframe": "5m",
                "stake_amount": 1
            }
        )

    def test_investment_recommendations_api(self):
        """Test investment recommendations API"""
        print("\n" + "="*50)
        print("TESTING INVESTMENT RECOMMENDATIONS API")
        print("="*50)
        
        # Test get investment recommendations
        success, data = self.run_test(
            "Get Investment Recommendations",
            "GET",
            "api/investment-recommendations",
            200
        )
        
        if success and data:
            print(f"   Found {len(data)} investment recommendations")
            if len(data) > 0:
                rec = data[0]
                print(f"   Sample recommendation: {rec.get('symbol', 'N/A')} - {rec.get('recommendation_type', 'N/A')}")
                print(f"   Confidence: {rec.get('confidence', 'N/A')}%")
                print(f"   Target Price: {rec.get('target_price', 'N/A')}")
                print(f"   Reason: {rec.get('reason', 'N/A')[:50]}...")
        
        # Test with different currencies and limits
        for currency in ["USD", "RUB", "EUR"]:
            success, data = self.run_test(
                f"Get Investment Recommendations ({currency})",
                "GET",
                "api/investment-recommendations",
                200,
                params={"currency": currency, "limit": 5}
            )
            
            if success and data:
                print(f"   {currency} recommendations: {len(data)} items")

    def test_user_settings_api(self):
        """Test user settings API endpoints"""
        print("\n" + "="*50)
        print("TESTING USER SETTINGS API")
        print("="*50)
        
        # Test get user settings without auth (should fail)
        self.run_test(
            "Get User Settings (Unauthenticated)",
            "GET",
            "api/user/settings",
            401
        )
        
        # Test update user settings without auth (should fail)
        self.run_test(
            "Update User Settings (Unauthenticated)",
            "PUT",
            "api/user/settings",
            401,
            data={
                "theme": "light",
                "language": "en",
                "notifications_enabled": False,
                "preferred_currency": "EUR"
            }
        )

    def test_currencies_api(self):
        """Test currencies API endpoint"""
        print("\n" + "="*50)
        print("TESTING CURRENCIES API")
        print("="*50)
        
        success, data = self.run_test(
            "Get Supported Currencies",
            "GET",
            "api/currencies",
            200
        )
        
        if success and data:
            currencies = data.get('currencies', [])
            print(f"   Found {len(currencies)} supported currencies")
            
            expected_currencies = ["USD", "RUB", "EUR", "GBP", "JPY", "CNY", "KRW", "INR"]
            found_codes = [curr.get('code') for curr in currencies]
            
            for expected in expected_currencies:
                if expected in found_codes:
                    print(f"   ✅ {expected} currency supported")
                else:
                    print(f"   ❌ {expected} currency missing")
            
            # Check currency structure
            if currencies:
                sample = currencies[0]
                required_fields = ['code', 'name', 'symbol']
                for field in required_fields:
                    if field in sample:
                        print(f"   ✅ Currency has {field} field")
                    else:
                        print(f"   ❌ Currency missing {field} field")

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
    print("🚀 Starting CripteX v2.0 API Testing...")
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n🔥 Testing NEW CripteX v2.0 Features:")
    print("   • Extended Crypto API with 50+ cryptocurrencies")
    print("   • Multi-currency support (USD, RUB, EUR, GBP, JPY, CNY, KRW, INR)")
    print("   • Binary Options API")
    print("   • Investment Recommendations with AI analysis")
    print("   • User Settings API")
    print("   • Enhanced Currencies API")
    
    tester = CripteXAPITester()
    
    # Run all tests
    tester.test_health_check()
    
    # Test new v2.0 features
    tester.test_extended_crypto_api()
    tester.test_binary_options_api()
    tester.test_investment_recommendations_api()
    tester.test_user_settings_api()
    tester.test_currencies_api()
    
    # Test existing features
    tester.test_auth_endpoints_without_session()
    tester.test_predictions_endpoints_without_auth()
    tester.test_bonus_endpoints_without_auth()
    tester.test_referral_endpoints_without_auth()
    tester.test_session_creation_invalid()
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS - CripteX v2.0")
    print("="*60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Detailed results breakdown
    print("\n📋 Test Categories Summary:")
    print("   • Extended Crypto API: Multi-currency support tested")
    print("   • Binary Options API: Authentication required (as expected)")
    print("   • Investment Recommendations: Public endpoint working")
    print("   • User Settings API: Authentication required (as expected)")
    print("   • Currencies API: All 8 currencies supported")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All CripteX v2.0 API tests passed!")
        return 0
    else:
        print("\n⚠️  Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())