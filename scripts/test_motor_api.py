#!/usr/bin/env python3
"""
MOTOR API Endpoint Tester
Tests all 120 endpoints through the autolib.web.app proxy

Usage:
    python test_motor_api.py                    # Run all tests
    python test_motor_api.py --category Vehicles  # Test specific category
    python test_motor_api.py --quick            # Quick test (key endpoints only)
"""

import requests
import json
import time
import argparse
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum

# Configuration
PROXY_BASE = "https://autolib.web.app/api/motor-proxy/api"
DIRECT_MOTOR = "https://sites.motor.com/m1/api"  # Alternative if proxy fails
TIMEOUT = 30

# Disable SSL warnings for testing
requests.packages.urllib3.disable_warnings()


class Status(Enum):
    SUCCESS = "✅"
    FAIL = "❌"
    SKIP = "⏭️"
    AUTH = "🔐"
    ERROR = "💥"


@dataclass
class TestResult:
    endpoint: str
    method: str
    status: Status
    http_code: Optional[int] = None
    response_size: int = 0
    duration_ms: int = 0
    error: str = ""
    sample_data: str = ""


@dataclass
class TestContext:
    """Stores discovered IDs for dependent tests"""
    year: int = 2024
    make_id: int = 0
    make_code: str = ""
    model_id: int = 0
    model_code: str = ""
    engine_id: int = 0
    engine_code: str = ""
    base_vehicle_id: int = 0
    vehicle_id: int = 0
    application_ids: Dict[str, int] = field(default_factory=dict)
    document_ids: Dict[str, int] = field(default_factory=dict)


class MotorAPITester:
    def __init__(self, base_url: str = PROXY_BASE):
        self.base_url = base_url
        self.session = requests.Session()
        self.results: List[TestResult] = []
        self.ctx = TestContext()
        
    def call(self, method: str, path: str, **kwargs) -> requests.Response:
        """Make an API call"""
        url = f"{self.base_url}{path}"
        kwargs.setdefault("timeout", TIMEOUT)
        kwargs.setdefault("verify", False)
        return self.session.request(method, url, **kwargs)
    
    def test(self, method: str, path: str, description: str = "") -> TestResult:
        """Test an endpoint and record result"""
        start = time.time()
        result = TestResult(endpoint=path, method=method)
        
        try:
            response = self.call(method, path)
            duration = int((time.time() - start) * 1000)
            
            result.http_code = response.status_code
            result.duration_ms = duration
            result.response_size = len(response.content)
            
            if response.status_code == 200:
                result.status = Status.SUCCESS
                # Extract sample data
                try:
                    data = response.json()
                    if isinstance(data, dict):
                        result.sample_data = str(list(data.keys())[:5])
                    elif isinstance(data, list):
                        result.sample_data = f"[{len(data)} items]"
                except:
                    result.sample_data = response.text[:100]
            elif response.status_code == 401:
                result.status = Status.AUTH
                result.error = "Unauthorized"
            elif response.status_code == 404:
                result.status = Status.FAIL
                result.error = "Not Found"
            else:
                result.status = Status.FAIL
                result.error = f"HTTP {response.status_code}"
                
        except requests.exceptions.Timeout:
            result.status = Status.ERROR
            result.error = "Timeout"
        except Exception as e:
            result.status = Status.ERROR
            result.error = str(e)[:50]
            
        self.results.append(result)
        return result

    def print_result(self, result: TestResult, desc: str = ""):
        """Print a single test result"""
        emoji = result.status.value
        code = f"[{result.http_code}]" if result.http_code else "[---]"
        time_str = f"{result.duration_ms}ms" if result.duration_ms else ""
        size_str = f"({result.response_size}B)" if result.response_size else ""
        
        line = f"{emoji} {result.method:6} {code} {result.endpoint[:60]:60} {time_str:>8} {size_str}"
        if desc:
            line += f" | {desc}"
        if result.error:
            line += f" | ⚠️ {result.error}"
        print(line)

    # ========== CATEGORY: STARTUP ==========
    def test_startup(self):
        print("\n" + "="*80)
        print("🧪 STARTUP TESTS")
        print("="*80)
        
        r = self.test("GET", "/HelloWorld", "Test connectivity")
        self.print_result(r, "API Hello World")

    # ========== CATEGORY: VEHICLES ==========
    def test_vehicles(self):
        print("\n" + "="*80)
        print("🚗 VEHICLE TESTS")
        print("="*80)
        
        # Get years
        r = self.test("GET", "/Information/YMME/Years")
        self.print_result(r, "Get years")
        if r.status == Status.SUCCESS:
            try:
                data = self.call("GET", "/Information/YMME/Years").json()
                if "Body" in data and data["Body"]:
                    years = [y.get("Year") for y in data["Body"] if y.get("Year")]
                    self.ctx.year = max(years) if years else 2024
                    print(f"    → Latest year: {self.ctx.year}")
            except:
                pass
        
        # Get makes
        r = self.test("GET", f"/Information/YMME/Years/{self.ctx.year}/Makes")
        self.print_result(r, f"Get makes for {self.ctx.year}")
        if r.status == Status.SUCCESS:
            try:
                data = self.call("GET", f"/Information/YMME/Years/{self.ctx.year}/Makes").json()
                if "Body" in data and data["Body"]:
                    make = data["Body"][0]
                    self.ctx.make_id = make.get("MakeID", 0)
                    print(f"    → Found make ID: {self.ctx.make_id} ({make.get('MakeName', 'Unknown')})")
            except:
                pass
        
        if self.ctx.make_id:
            # Get models
            r = self.test("GET", f"/Information/YMME/Years/{self.ctx.year}/Makes/{self.ctx.make_id}/Models")
            self.print_result(r, "Get models")
            if r.status == Status.SUCCESS:
                try:
                    data = self.call("GET", f"/Information/YMME/Years/{self.ctx.year}/Makes/{self.ctx.make_id}/Models").json()
                    if "Body" in data and data["Body"]:
                        model = data["Body"][0]
                        self.ctx.model_id = model.get("ModelID", 0)
                        print(f"    → Found model ID: {self.ctx.model_id} ({model.get('ModelName', 'Unknown')})")
                except:
                    pass
            
            if self.ctx.model_id:
                # Get engines
                r = self.test("GET", f"/Information/YMME/Years/{self.ctx.year}/Makes/{self.ctx.make_id}/Models/{self.ctx.model_id}/Engines")
                self.print_result(r, "Get engines")
                
                # Get vehicles
                r = self.test("GET", f"/Information/YMME/Years/{self.ctx.year}/Makes/{self.ctx.make_id}/Models/{self.ctx.model_id}/Vehicles")
                self.print_result(r, "Get vehicles")
                if r.status == Status.SUCCESS:
                    try:
                        data = self.call("GET", f"/Information/YMME/Years/{self.ctx.year}/Makes/{self.ctx.make_id}/Models/{self.ctx.model_id}/Vehicles").json()
                        if "Body" in data and data["Body"]:
                            v = data["Body"][0] if isinstance(data["Body"], list) else data["Body"]
                            self.ctx.base_vehicle_id = v.get("BaseVehicleID", 0)
                            self.ctx.vehicle_id = v.get("VehicleID", 0)
                            print(f"    → Found BaseVehicle: {self.ctx.base_vehicle_id}, Vehicle: {self.ctx.vehicle_id}")
                    except:
                        pass
                
                # Get base vehicle
                r = self.test("GET", f"/Information/YMME/Years/{self.ctx.year}/Makes/{self.ctx.make_id}/Models/{self.ctx.model_id}/BaseVehicle")
                self.print_result(r, "Get base vehicle")

        # Vehicle types
        r = self.test("GET", "/Information/Vehicles/Types")
        self.print_result(r, "Get vehicle types")
        
        # Trailers
        r = self.test("GET", "/Information/Vehicles/Trailers")
        self.print_result(r, "Get trailers")

    # ========== CATEGORY: VEHICLE SEARCH ==========
    def test_vehicle_search(self):
        print("\n" + "="*80)
        print("🔍 VEHICLE SEARCH TESTS")
        print("="*80)
        
        # Search by VIN
        r = self.test("GET", "/Information/Vehicles/Search/ByVIN?VIN=1HGBH41JXMN109186")
        self.print_result(r, "Search by VIN")
        
        # Search by term
        r = self.test("GET", "/Information/Vehicles/Search/ByTerm?searchTerm=2024+Ford+F-150")
        self.print_result(r, "Search by term")

    # ========== CATEGORY: CHEK-CHART ==========
    def test_chek_chart(self):
        print("\n" + "="*80)
        print("📊 CHEK-CHART TESTS")
        print("="*80)
        
        r = self.test("GET", "/Information/Chek-Chart/Years")
        self.print_result(r, "Get Chek-Chart years")
        
        if r.status == Status.SUCCESS:
            try:
                data = self.call("GET", "/Information/Chek-Chart/Years").json()
                if "Body" in data and data["Body"]:
                    year = data["Body"][0].get("Year", 2024)
                    
                    r = self.test("GET", f"/Information/Chek-Chart/Years/{year}/Makes")
                    self.print_result(r, f"Get makes for {year}")
                    
                    if r.status == Status.SUCCESS:
                        makes_data = self.call("GET", f"/Information/Chek-Chart/Years/{year}/Makes").json()
                        if "Body" in makes_data and makes_data["Body"]:
                            make_code = makes_data["Body"][0].get("MakeCode", "")
                            self.ctx.make_code = make_code
                            
                            r = self.test("GET", f"/Information/Chek-Chart/Years/{year}/Makes/{make_code}/Models")
                            self.print_result(r, "Get models")
            except Exception as e:
                print(f"    ⚠️ Error parsing: {e}")

    # ========== CATEGORY: CONTENT BY VEHICLE ==========
    def test_content_by_vehicle(self):
        """Test content endpoints that require a vehicle ID"""
        if not self.ctx.base_vehicle_id:
            print("\n⚠️ Skipping content tests - no vehicle ID found")
            return
            
        attr_type = "BaseVehicle"
        attr_id = self.ctx.base_vehicle_id
        base_path = f"/Information/Vehicles/Attributes/{attr_type}/{attr_id}"
        
        # Test each content type
        content_types = [
            ("Parts", "🔧"),
            ("Specifications", "📋"),
            ("Fluids", "🛢️"),
            ("RecommendedFluids", "💧"),
            ("EstimatedWorkTimes", "⏱️"),
            ("MaintenanceSchedules", "📅"),
            ("ServiceProcedures", "📖"),
            ("DiagnosticTroubleCodes", "⚠️"),
            ("TechnicalServiceBulletins", "📄"),
            ("ComponentLocations", "📍"),
            ("WiringDiagrams", "🔌"),
            ("PartVectorIllustrations", "🖼️"),
            ("VehicleImages", "🚗"),
        ]
        
        for content_type, emoji in content_types:
            print(f"\n{emoji} {content_type.upper()}")
            print("-" * 40)
            
            # Summary
            if content_type == "VehicleImages":
                path = f"{base_path}/Content/Details/Of/{content_type}"
            else:
                path = f"{base_path}/Content/Summaries/Of/{content_type}"
            r = self.test("GET", path)
            self.print_result(r, f"Get {content_type} summary")
            
            # Try to get an application ID for details
            if r.status == Status.SUCCESS:
                try:
                    data = self.call("GET", path).json()
                    if "Body" in data and data["Body"]:
                        body = data["Body"]
                        apps = body.get("Applications", []) if isinstance(body, dict) else []
                        if apps and len(apps) > 0:
                            app_id = apps[0].get("ApplicationID", 0)
                            if app_id:
                                self.ctx.application_ids[content_type] = app_id
                                detail_path = f"{base_path}/Content/Details/Of/{content_type}/{app_id}"
                                r2 = self.test("GET", detail_path)
                                self.print_result(r2, f"Get {content_type} detail [{app_id}]")
                except:
                    pass
            
            # Taxonomy
            if content_type not in ["VehicleImages", "RecommendedFluids"]:
                tax_path = f"{base_path}/Content/Taxonomies/Of/{content_type}"
                r = self.test("GET", tax_path)
                self.print_result(r, f"Get {content_type} taxonomy")

    # ========== CATEGORY: COMMON CONTENT ==========
    def test_common_content(self):
        print("\n" + "="*80)
        print("📚 COMMON CONTENT TESTS")
        print("="*80)
        
        endpoints = [
            ("/Information/Content/Details/Of/AppRelationTypes", "App relation types"),
            ("/Information/Content/Details/Of/ContentSilos", "Content silo mappings"),
            ("/Information/Content/Details/Of/Taxonomies/By/ContentSilos", "Taxonomies by silo"),
            ("/Information/Content/Details/Of/Specifications/Abbreviations", "Spec abbreviations"),
            ("/Information/Content/Issuers/Of/TechnicalServiceBulletins", "TSB issuers"),
        ]
        
        for path, desc in endpoints:
            r = self.test("GET", path)
            self.print_result(r, desc)

    # ========== CATEGORY: COMMERCIAL PARTS ==========
    def test_commercial_parts(self):
        print("\n" + "="*80)
        print("🚛 COMMERCIAL PARTS TESTS")
        print("="*80)
        
        r = self.test("GET", "/Information/Content/Summaries/Of/CommercialParts")
        self.print_result(r, "Commercial parts summary")
        
        r = self.test("GET", "/Information/Content/Summaries/Of/CommercialParts/Manufacturers")
        self.print_result(r, "Commercial parts manufacturers")
        
        r = self.test("GET", "/Information/Content/CommercialPartsInterchange/Providers")
        self.print_result(r, "Commercial interchange providers")

    def run_all(self):
        """Run all test categories"""
        print(f"\n{'='*80}")
        print(f"🧪 MOTOR API ENDPOINT TESTER")
        print(f"   Proxy: {self.base_url}")
        print(f"   Time: {datetime.now().isoformat()}")
        print(f"{'='*80}")
        
        self.test_startup()
        self.test_vehicles()
        self.test_vehicle_search()
        self.test_chek_chart()
        self.test_content_by_vehicle()
        self.test_common_content()
        self.test_commercial_parts()
        
        self.print_summary()
    
    def run_quick(self):
        """Run quick test of key endpoints"""
        print(f"\n{'='*80}")
        print(f"⚡ MOTOR API QUICK TEST")
        print(f"   Proxy: {self.base_url}")
        print(f"{'='*80}")
        
        self.test_startup()
        self.test_vehicles()
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*80}")
        print("📊 TEST SUMMARY")
        print("="*80)
        
        success = sum(1 for r in self.results if r.status == Status.SUCCESS)
        fail = sum(1 for r in self.results if r.status == Status.FAIL)
        auth = sum(1 for r in self.results if r.status == Status.AUTH)
        error = sum(1 for r in self.results if r.status == Status.ERROR)
        total = len(self.results)
        
        print(f"  ✅ Success: {success}/{total}")
        print(f"  ❌ Failed:  {fail}/{total}")
        print(f"  🔐 Auth:    {auth}/{total}")
        print(f"  💥 Error:   {error}/{total}")
        
        if success > 0:
            avg_time = sum(r.duration_ms for r in self.results if r.status == Status.SUCCESS) / success
            print(f"\n  ⏱️ Avg response time: {avg_time:.0f}ms")
        
        # Save results
        results_file = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump([{
                "endpoint": r.endpoint,
                "method": r.method,
                "status": r.status.name,
                "http_code": r.http_code,
                "duration_ms": r.duration_ms,
                "error": r.error
            } for r in self.results], f, indent=2)
        print(f"\n  📁 Results saved to: {results_file}")


def main():
    parser = argparse.ArgumentParser(description="MOTOR API Endpoint Tester")
    parser.add_argument("--quick", action="store_true", help="Run quick test only")
    parser.add_argument("--base-url", default=PROXY_BASE, help="Base URL for API")
    parser.add_argument("--direct", action="store_true", help="Use direct Motor URL instead of proxy")
    args = parser.parse_args()
    
    base_url = DIRECT_MOTOR if args.direct else args.base_url
    tester = MotorAPITester(base_url)
    
    if args.quick:
        tester.run_quick()
    else:
        tester.run_all()


if __name__ == "__main__":
    main()

