# MOTOR API Endpoint Map

**Generated:** 2025-11-28  
**Source:** https://api.motor.com/v1/documentation/swagger  
**Swagger Version:** 2.0  
**API Version:** 25.10.1  
**Total Endpoints:** 120  
**Proxy Base URL:** https://autolib.web.app/api/motor-proxy

---

## 🔑 Authentication

The proxy handles authentication automatically via EBSCO library card.  
Direct API access requires HMAC-SHA256 signatures.

### Token Management
| Method | Path | Description |
|--------|------|-------------|
| POST | `/Token` | Create Token |
| DELETE | `/Token` | Delete Token |

---

## 🚗 Vehicle Lookup (14 endpoints)

### YMME (Year/Make/Model/Engine) Selection
| Method | Path | Proxy Path | Description |
|--------|------|------------|-------------|
| GET | `/Information/YMME/Years` | `/api/motor-proxy/api/YMME/Years` | Get all available years |
| GET | `/Information/YMME/Years/{Year}/Makes` | `/api/motor-proxy/api/YMME/Years/{Year}/Makes` | Get makes for year |
| GET | `/Information/YMME/Years/{Year}/Makes/{MakeID}/Models` | `/api/motor-proxy/api/YMME/Years/{Year}/Makes/{MakeID}/Models` | Get models |
| GET | `/Information/YMME/Years/{Year}/Makes/{MakeID}/Models/{ModelID}/Engines` | `/api/motor-proxy/api/YMME/Years/{Year}/Makes/{MakeID}/Models/{ModelID}/Engines` | Get engines |
| GET | `/Information/YMME/Years/{Year}/Makes/{MakeID}/Models/{ModelID}/Vehicles` | `/api/motor-proxy/api/YMME/Years/{Year}/Makes/{MakeID}/Models/{ModelID}/Vehicles` | Get vehicles by YMM |
| GET | `/Information/YMME/Years/{Year}/Makes/{MakeID}/Models/{ModelID}/BaseVehicle` | `/api/motor-proxy/api/YMME/Years/{Year}/Makes/{MakeID}/Models/{ModelID}/BaseVehicle` | Get base vehicle details |

### Vehicle Types & Attributes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Types` | Get vehicle types (car, truck, etc.) |
| GET | `/Information/Vehicles/Trailers` | Get trailer details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/BaseVehicle` | Get base vehicle by attribute |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Vehicle` | Get vehicle details by attribute |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Vehicles` | Get vehicles by attribute |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/BaseVehicle/Attributes` | Get all vehicle attributes |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/BaseVehicle/Attributes/{VehicleAttributeLookupType}` | Get specific attribute type |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Vehicles/Attributes/Configurations` | Get valid vehicle configurations |

---

## 🔍 Vehicle Search (3 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Search/ByVIN` | Search by VIN |
| GET | `/Information/Vehicles/Search/ByTerm` | Search by text term |
| POST | `/Information/Vehicles/Search/Bulk/ByVIN` | Bulk VIN search |
| POST | `/Information/Vehicles/Search/BulkVehicleAttributes` | Bulk vehicle attributes |

---

## 📊 Chek-Chart (5 endpoints)

Alternative vehicle lookup method using Make/Model codes.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Chek-Chart/Years` | Get years |
| GET | `/Information/Chek-Chart/Years/{Year}/Makes` | Get makes by year |
| GET | `/Information/Chek-Chart/Years/{Year}/Makes/{MakeCode}/Models` | Get models |
| GET | `/Information/Chek-Chart/Years/{Year}/Makes/{MakeCode}/Models/{ModelCode}/Engines` | Get engines |
| GET | `/Information/Chek-Chart/Years/{Year}/Makes/{MakeCode}/Models/{ModelCode}/Engines/{EngineCode}/Vehicles` | Get vehicles |

---

## 🔧 Parts (7 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Parts/Content/Summaries/Of/Parts` | Get parts by part number |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/Parts` | Get parts summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/Parts/{ApplicationID}` | Get part details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/Parts/{DocumentID}` | Get part document |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/Parts` | Get parts taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/Parts/RelatedTo/{ContentType}/{ApplicationID}` | Get related parts |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/Parts/RelatedTo/{ContentType}/{ApplicationID}` | Get related parts taxonomy |

---

## 📋 Specifications (7 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Content/Details/Of/Specifications/Abbreviations` | Get spec abbreviations |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/Specifications` | Get specs summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/Specifications/{ApplicationID}` | Get spec details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/Specifications/{DocumentID}` | Get spec document |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/Specifications` | Get specs taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/Specifications/RelatedTo/{ContentType}/{ApplicationID}` | Get related specs |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/Specifications/RelatedTo/{ContentType}/{ApplicationID}` | Get related specs taxonomy |

---

## 🛢️ Fluids (5 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/Fluids` | Get fluids summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/Fluids/{ApplicationID}` | Get fluid details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/Fluids` | Get fluids taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/Fluids/RelatedTo/{ContentType}/{ApplicationID}` | Get related fluids |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/Fluids/RelatedTo/{ContentType}/{ApplicationID}` | Get related fluids taxonomy |

---

## 💧 Recommended Fluids (2 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/RecommendedFluids` | Get recommended fluids |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/RecommendedFluids/{DocumentID}` | Get fluid document |

---

## ⏱️ Estimated Work Times (6 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/EstimatedWorkTimes` | Get EWT summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/EstimatedWorkTimes/{ApplicationID}` | Get EWT details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/EstimatedWorkTimes` | Get EWT taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/EstimatedWorkTimes/RelatedTo/{ContentType}/{ApplicationID}` | Get related EWT |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/EstimatedWorkTimes/RelatedTo/{ContentType}/{ApplicationID}` | Get related EWT taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/VMRS/Of/EstimatedWorkTimes` | Get VMRS codes |

---

## 📅 Maintenance Schedules (11 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/MaintenanceSchedules` | Get maintenance summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/MaintenanceSchedules` | Get maintenance details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/MaintenanceSchedules/{ApplicationID}` | Get specific maintenance |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/MaintenanceSchedules/{DocumentID}` | Get maintenance document |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/MaintenanceSchedules` | Get maintenance taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/MaintenanceSchedules/Indicators` | Get indicator summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/MaintenanceSchedules/Intervals/{IntervalType}` | Get interval summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/MaintenanceSchedules/FrequencyTypes/{FrequencyTypeCode}` | Get by frequency type |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/MaintenanceSchedules/Indicators/{IndicatorName}` | Get by indicator |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/MaintenanceSchedules/Timeline/At/Months` | Get timeline by months |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/MaintenanceSchedules/Timeline/At/{IntervalType}/{IntervalValue}` | Get timeline |

---

## 📖 Service Procedures (6 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/ServiceProcedures` | Get procedures summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/ServiceProcedures/{ApplicationID}` | Get procedure details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/ServiceProcedures/{DocumentID}` | Get procedure document |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/ServiceProcedures` | Get procedures taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/ServiceProcedures/RelatedTo/{ContentType}/{ApplicationID}` | Get related procedures |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/ServiceProcedures/RelatedTo/{ContentType}/{ApplicationID}` | Get related procedures taxonomy |

---

## ⚠️ Diagnostic Trouble Codes (5 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/DiagnosticTroubleCodes` | Get DTC summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/DiagnosticTroubleCodes/{ApplicationID}` | Get DTC details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/DiagnosticTroubleCodes/{DocumentID}` | Get DTC document |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/DiagnosticTroubleCodes` | Get DTC taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/DiagnosticTroubleCodes/SupportingTests/In/Taxonomy/SAESubject/{SAESubjectID}/SAESystem/{SAESystemID}` | Get SAE tests |

---

## 📄 Technical Service Bulletins (8 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Content/Issuers/Of/TechnicalServiceBulletins` | Get TSB issuers |
| GET | `/Information/Content/Summaries/Of/TechnicalServiceBulletins/RelatedTo/ManufacturerNumber` | Get TSB by manufacturer |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/TechnicalServiceBulletins` | Get TSB summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/TechnicalServiceBulletins/{ApplicationID}` | Get TSB details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/TechnicalServiceBulletins/{DocumentID}` | Get TSB document |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/TechnicalServiceBulletins` | Get TSB taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/TechnicalServiceBulletins/RelatedTo/{ContentType}/{ApplicationID}` | Get related TSB |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/TechnicalServiceBulletins/RelatedTo/{ContentType}/{ApplicationID}` | Get related TSB taxonomy |

---

## 📍 Component Locations (6 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/ComponentLocations` | Get locations summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/ComponentLocations/{ApplicationID}` | Get location details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/ComponentLocations/{DocumentID}` | Get location document |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/ComponentLocations` | Get locations taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/ComponentLocations/RelatedTo/{ContentType}/{ApplicationID}` | Get related locations |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/ComponentLocations/RelatedTo/{ContentType}/{ApplicationID}` | Get related locations taxonomy |

---

## 🔌 Wiring Diagrams (9 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/WiringDiagrams` | Get wiring summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/WiringDiagrams/{ApplicationID}` | Get wiring details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/WiringDiagrams/{DocumentID}` | Get wiring document |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/WiringDiagrams` | Get wiring taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/OEMComponents` | Get OEM components |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/OEMComponents/RelatedTo/{ContentType}/{ApplicationID}` | Get related OEM |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/WiringDiagrams/RelatedTo/{ContentType}/{ApplicationID}` | Get related wiring |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/WiringDiagrams/RelatedTo/{ContentType}/{ApplicationID}` | Get related wiring taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/{ContentType}/{ApplicationID}/Documents/{DocumentID}/OEMComponents` | Get OEM by document |

---

## 🖼️ Part Vector Illustrations (8 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/PartVectorIllustrations` | Get PVI summary |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/PartVectorIllustrations/{ApplicationID}` | Get PVI details |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/PartVectorIllustrations/{DocumentID}` | Get PVI document |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/PartVectorIllustrations` | Get PVI taxonomy |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/PartVectorIllustrations/RelatedTo/PCDB/Part/{PartTerminologyID}` | Get PVI by PCDB |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Summaries/Of/PartVectorIllustrations/RelatedTo/{ContentType}/{ApplicationID}` | Get related PVI |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/PartVectorIllustrations/RelatedTo/PCDB/Part/{PartTerminologyID}` | Get PVI taxonomy by PCDB |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Taxonomies/Of/PartVectorIllustrations/RelatedTo/{ContentType}/{ApplicationID}` | Get related PVI taxonomy |

---

## 🚛 Commercial Parts (7 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Content/Summaries/Of/CommercialParts` | Get commercial parts summary |
| GET | `/Information/Content/Details/Of/CommercialParts/{CommercialPartsID}` | Get commercial part details |
| GET | `/Information/Content/Summaries/Of/CommercialParts/Manufacturers` | Get manufacturers |
| GET | `/Information/Content/Documents/Of/CommercialParts/{DocumentID}` | Get commercial part document |
| GET | `/Information/Content/CommercialPartsInterchange/Providers` | Get entitled providers |
| GET | `/Information/Content/CommercialPartsInterchange/CrossReferences` | Get cross references |
| GET | `/Information/Content/CommercialPartsInterchange/PartSearch` | Search by cross reference |

---

## 🏷️ PCDB Parts (2 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/PCDB/Details/Of/Parts` | Get PCDB parts by number |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/PCDB/Details/Of/Parts/RelatedTo/{ContentType}/{ApplicationID}` | Get PCDB by relation |

---

## 🖼️ Vehicle Images (2 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Details/Of/VehicleImages` | Get vehicle images index |
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/Content/Documents/Of/VehicleImages/{DocumentID}` | Get vehicle image |

---

## 📚 Content Common (3 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Content/Details/Of/AppRelationTypes` | Get app relation types |
| GET | `/Information/Content/Details/Of/ContentSilos` | Get content silo mappings |
| GET | `/Information/Content/Details/Of/Taxonomies/By/ContentSilos` | Get taxonomies by silo |

---

## 🚚 VMRS (1 endpoint)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/Information/Vehicles/Attributes/{AttributeType}/{AttributeID}/VMRS/Details/Of/Parts/RelatedTo/{ContentType}/{ApplicationID}` | Get VMRS parts |

---

## 🧪 Startup/Test (2 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/HelloWorld` | Test API connectivity |
| PUT | `/HelloWorld` | Test write access |

---

## 🔗 Path Translation

### MOTOR API → Proxy Mapping

| MOTOR API (api.motor.com/v1) | Proxy (autolib.web.app) |
|------------------------------|-------------------------|
| `/v1/Information/YMME/Years` | `/api/motor-proxy/api/YMME/Years` |
| `/v1/Information/Vehicles/...` | `/api/motor-proxy/api/Vehicles/...` |
| `/v1/Information/Content/...` | `/api/motor-proxy/api/Content/...` |
| `/v1/HelloWorld` | `/api/motor-proxy/api/HelloWorld` |

### AttributeType Values
- `BaseVehicle` - Base vehicle ID
- `Vehicle` - Full vehicle ID  
- `Engine` - Engine ID
- `SubModel` - Sub-model ID
- `ValidVehicleConfiguration` - VVC ID

### ContentType Values
- `Parts` - Parts content
- `Specifications` - Specifications
- `Fluids` - Fluid recommendations
- `ServiceProcedures` - Service procedures
- `EstimatedWorkTimes` - Labor times
- `MaintenanceSchedules` - Maintenance
- `DiagnosticTroubleCodes` - DTCs
- `TechnicalServiceBulletins` - TSBs
- `WiringDiagrams` - Wiring
- `ComponentLocations` - Component locations
- `PartVectorIllustrations` - Part illustrations

---

## 📊 Summary

| Category | Endpoints |
|----------|-----------|
| Vehicles | 14 |
| Vehicle Search | 4 |
| Chek-Chart | 5 |
| Parts | 7 |
| Specifications | 7 |
| Fluids | 5 |
| Recommended Fluids | 2 |
| Estimated Work Times | 6 |
| Maintenance Schedules | 11 |
| Service Procedures | 6 |
| Diagnostic Trouble Codes | 5 |
| Technical Service Bulletins | 8 |
| Component Locations | 6 |
| Wiring Diagrams | 9 |
| Part Vector Illustrations | 8 |
| Commercial Parts | 7 |
| PCDB Parts | 2 |
| Vehicle Images | 2 |
| Content Common | 3 |
| VMRS | 1 |
| Token Auth | 2 |
| Startup | 2 |
| **TOTAL** | **120** |

