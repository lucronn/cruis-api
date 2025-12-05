import urllib.request
import json
import sys

BASE_URL = "https://autolib.web.app/api/motor-proxy/api"
CONTENT_SOURCE = "MOTOR"
VEHICLE_ID = "188569:13820" # Known valid ID

def test_interval_type(interval_type):
    url = f"{BASE_URL}/source/{CONTENT_SOURCE}/vehicle/{VEHICLE_ID}/maintenanceSchedules/intervals?intervalType={interval_type}&interval=30000"
    print(f"Testing intervalType='{interval_type}'...")
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req) as response:
            if response.getcode() == 200:
                print(f"✅ Success! '{interval_type}' is valid.")
                return True
            else:
                print(f"❌ Failed with status {response.getcode()}")
                return False
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        content = e.read().decode('utf-8')
        print(f"   Response: {content}")
        return False
    except Exception as e:
        print(f"❌ Request Failed: {e}")
        return False

if __name__ == "__main__":
    # Test 'Miles' first as it's the most likely candidate
    if test_interval_type("Miles"):
        sys.exit(0)
    
    # If that fails, try others
    test_interval_type("Distance")
    test_interval_type("Kilometers")
    test_interval_type("Month")
    test_interval_type("Months")
