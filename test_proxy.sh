#!/bin/bash
# Test script for AutoLib Motor Proxy API
# Usage: ./test_proxy.sh

PROXY_BASE="https://autolib.web.app/api/motor-proxy"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "🧪 AutoLib Motor Proxy API Test"
echo "   Base: $PROXY_BASE"
echo "   Time: $(date)"
echo "=========================================="

test_endpoint() {
    local method=$1
    local path=$2
    local desc=$3
    
    local start=$(date +%s%N)
    local response=$(curl -s -w "\n%{http_code}" "$PROXY_BASE$path" 2>/dev/null)
    local end=$(date +%s%N)
    
    local http_code=$(echo "$response" | tail -1)
    local body=$(echo "$response" | head -n -1)
    local duration=$(( (end - start) / 1000000 ))
    
    if [ "$http_code" = "200" ]; then
        local size=${#body}
        echo -e "${GREEN}✅${NC} [$http_code] $path ${YELLOW}(${duration}ms, ${size}B)${NC}"
        echo "   $desc"
        # Show sample of response
        echo "   → $(echo "$body" | head -c 80)..."
    else
        echo -e "${RED}❌${NC} [$http_code] $path"
        echo "   $desc"
    fi
    echo ""
}

echo ""
echo "=== HEALTH CHECK ==="
test_endpoint GET "/health" "Proxy health status"

echo ""
echo "=== VEHICLE SELECTION ==="
test_endpoint GET "/api/years" "Get available years"
test_endpoint GET "/api/year/2024/makes" "Get makes for 2024"
test_endpoint GET "/api/year/2024/make/Ford/models" "Get Ford models for 2024"

# Get a vehicle ID from the models response
echo ""
echo "=== CONTENT ENDPOINTS ==="
VEHICLE_ID="2024%3AFord%3AF-150"
CONTENT_SOURCE="Ford"

test_endpoint GET "/api/source/${CONTENT_SOURCE}/${VEHICLE_ID}/name" "Get vehicle name"
test_endpoint GET "/api/source/${CONTENT_SOURCE}/vehicle/${VEHICLE_ID}/articles/v2" "Get articles"
test_endpoint GET "/api/source/${CONTENT_SOURCE}/vehicle/${VEHICLE_ID}/parts" "Get parts"
test_endpoint GET "/api/source/${CONTENT_SOURCE}/vehicle/${VEHICLE_ID}/specifications" "Get specifications"
test_endpoint GET "/api/source/${CONTENT_SOURCE}/vehicle/${VEHICLE_ID}/fluids" "Get fluids"

echo ""
echo "=== MAINTENANCE SCHEDULES ==="
test_endpoint GET "/api/source/${CONTENT_SOURCE}/vehicle/${VEHICLE_ID}/maintenance-schedules/by-interval?intervalType=miles&interval=5000&severity=normal" "Maintenance by interval"
test_endpoint GET "/api/source/${CONTENT_SOURCE}/vehicle/${VEHICLE_ID}/maintenance-schedules/by-indicator?severity=normal" "Maintenance by indicator"

echo ""
echo "=== VIN SEARCH (WORKING!) ==="
test_endpoint GET "/api/vin/1FA6P8TH4L5123456/vehicle" "VIN Decode (Ford Mustang)"

echo ""
echo "=== FULL VIN LOOKUP FLOW ==="
# The VIN decode returns: vehicleId=2020%3AFord%3AMustang, contentSource=Ford
test_endpoint GET "/api/source/Ford/2020%3AFord%3AMustang/name" "Vehicle Name from VIN"
test_endpoint GET "/api/source/Ford/vehicle/2020%3AFord%3AMustang/articles/v2" "Articles from VIN"

echo ""
echo "=========================================="
echo "Test completed at $(date)"
echo "=========================================="

