#!/usr/bin/env python3
"""
OpenAPI Compliance Verifier
Verifies that live API endpoints return the expected 'data' property for list items.
"""

import urllib.request
import urllib.error
import json
import sys

BASE_URL = "https://autolib.web.app/api/motor-proxy/api"
CONTENT_SOURCE = "MOTOR"

def make_request(url):
    """Make a GET request using urllib."""
    try:
        req = urllib.request.Request(url)
        # Add headers if needed, e.g. User-Agent
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req, timeout=60) as response:
            content = response.read().decode('utf-8')
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                print(f"❌ JSON Decode Error. Content preview: {content[:200]}")
                return None
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        return None
    except Exception as e:
        print(f"❌ Request Failed: {e}")
        return None

def get_vehicle_id():
    """Discover a valid vehicle ID for testing."""
    print("🔍 Discovering vehicle ID...")
    try:
        # Get Years
        data = make_request(f"{BASE_URL}/Information/YMME/Years")
        if not data:
             print("⚠️ Discovery failed (no data). Using fallback vehicle ID: 188569:13820")
             return "188569:13820"
        years = [y["Year"] for y in data["Body"]]
        year = max(years)
        
        # Get Makes
        data = make_request(f"{BASE_URL}/Information/YMME/Years/{year}/Makes")
        if not data: return None
        make = data["Body"][0]
        make_id = make["MakeID"]
        
        # Get Models
        data = make_request(f"{BASE_URL}/Information/YMME/Years/{year}/Makes/{make_id}/Models")
        if not data: return None
        model = data["Body"][0]
        model_id = model["ModelID"]
        
        # Get Vehicles
        data = make_request(f"{BASE_URL}/Information/YMME/Years/{year}/Makes/{make_id}/Models/{model_id}/Vehicles")
        if not data: return None
        vehicle = data["Body"][0]
        vehicle_id = vehicle["VehicleID"]
        
        print(f"✅ Found Vehicle ID: {vehicle_id} ({year} {make['MakeName']} {model['ModelName']})")
        return vehicle_id
    except Exception as e:
        print(f"❌ Failed to discover vehicle ID: {e}")
        print("⚠️ Using fallback vehicle ID: 188569:13820")
        return "188569:13820"

def verify_endpoint(name, url, expected_property="data"):
    """Verify a specific endpoint returns the expected property."""
    print(f"\nTesting {name}...")
    print(f"URL: {url}")
    
    data = make_request(url)
    if not data:
        return False
        
    # Check for body wrapper
    body = data.get("body", data)
    
    keys = list(body.keys()) if isinstance(body, dict) else []
    print(f"Response Keys: {keys}")
    
    if expected_property in body:
            print(f"✅ Success: Found '{expected_property}' property.")
            items = body[expected_property]
            print(f"   Item count: {len(items) if isinstance(items, list) else 'N/A'}")
            if expected_property == "categories":
                print(f"   Categories: {[c.get('name') for c in items]}")
            if expected_property == "data" and name == "Specs" and len(items) > 0:
                print(f"   First Spec Item: {json.dumps(items[0], indent=2)}")
            if expected_property == "data" and name == "Other" and len(items) > 0:
                print(f"   First Other Item: {json.dumps(items[0], indent=2)}")
            return True
    else:
        print(f"❌ Failure: '{expected_property}' property NOT found.")
        print(f"   Found properties: {keys}")
        return False

def main():
    vehicle_id = get_vehicle_id()
    if not vehicle_id:
        print("Could not get vehicle ID, aborting.")
        sys.exit(1)
    
    base_api = f"{BASE_URL}/source/{CONTENT_SOURCE}/vehicle/{vehicle_id}"
    
    tests = [
        ("Specs", f"{base_api}/specs", "data"),
        ("Procedures", f"{base_api}/procedures", "data"),
        ("Diagrams", f"{base_api}/diagrams", "data"),
        ("Fluids", f"{base_api}/fluids", "data"),
        ("Labor", f"{base_api}/labor-times", "data"),
        ("Categories", f"{base_api}/categories", "categories"),
        ("Other", f"{base_api}/articles/v2?searchTerm=&bucket=Other", "data"),
    ]
    
    success_count = 0
    for name, url, prop in tests:
        if verify_endpoint(name, url, prop):
            success_count += 1
            
    print(f"\n{'='*40}")
    print(f"Summary: {success_count}/{len(tests)} Tests Passed")
    print(f"{'='*40}")

if __name__ == "__main__":
    main()
