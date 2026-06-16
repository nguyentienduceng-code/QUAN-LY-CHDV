---
phase: 2
title: "API Development"
status: pending
priority: P1
effort: "3 weeks"
dependencies: [1]
---

# Phase 2: API Development

## Overview

Implement complete REST API for all property management entities (buildings, rooms, contracts, invoices, maintenance tickets, settings). Build on Phase 1 foundation with tenant-isolated CRUD operations, business logic, and data validation.

**Duration:** 3 weeks  
**Team:** 1-2 backend developers  
**Deliverables:** 30+ API endpoints with business logic, file upload, Excel export

## Requirements

### Functional
- CRUD operations for buildings, rooms, contracts, invoices, maintenance tickets, settings
- File upload for room images (multer + sharp)
- Excel export for all data (exceljs)
- Dashboard statistics endpoint (revenue, expenses, profit, occupancy)
- Batch invoice generation (create invoices for all active contracts)
- Meter readings update (electric, water indexes)
- Search and filter endpoints with query params

### Non-Functional
- All endpoints enforce tenant isolation (can't access other tenants' data)
- Input validation with Zod schemas
- Pagination for list endpoints (50 items per page)
- Image processing: resize to 1200x800, optimize quality
- Excel export includes all entities in separate sheets
- Response time <500ms for CRUD operations
- Audit logging for all state-changing operations

## Architecture

### API Endpoint Structure

```
/api/
├── auth/              # Phase 1 (already done)
├── buildings/         # Buildings CRUD
├── rooms/             # Rooms CRUD + image upload
├── contracts/         # Contracts CRUD
├── invoices/          # Invoices CRUD + batch generation
├── tickets/           # Maintenance tickets CRUD
├── settings/          # Settings per building
├── dashboard/         # Statistics and analytics
└── export/            # Excel export
```

### Controller-Service-Repository Pattern

**Example: Buildings**
```
buildingController.js     # HTTP handling
    ↓
buildingService.js        # Business logic + validation
    ↓
buildingRepository.js     # Database queries
```

### Data Flow

```
Client Request
    ↓
Auth Middleware (verify JWT)
    ↓
Tenant Context Middleware (inject tenant_id)
    ↓
Validation Middleware (Zod schema)
    ↓
Controller (parse request)
    ↓
Service (business logic)
    ↓
Repository (database query with tenant_id)
    ↓
Response (JSON)
```

## Related Code Files

### Create
- `backend/src/controllers/buildingController.js`
- `backend/src/controllers/roomController.js`
- `backend/src/controllers/contractController.js`
- `backend/src/controllers/invoiceController.js`
- `backend/src/controllers/ticketController.js`
- `backend/src/controllers/settingsController.js`
- `backend/src/controllers/dashboardController.js`
- `backend/src/controllers/exportController.js`
- `backend/src/services/buildingService.js`
- `backend/src/services/roomService.js`
- `backend/src/services/contractService.js`
- `backend/src/services/invoiceService.js`
- `backend/src/services/ticketService.js`
- `backend/src/services/settingsService.js`
- `backend/src/services/dashboardService.js`
- `backend/src/services/exportService.js`
- `backend/src/repositories/buildingRepository.js`
- `backend/src/repositories/roomRepository.js`
- `backend/src/repositories/contractRepository.js`
- `backend/src/repositories/invoiceRepository.js`
- `backend/src/repositories/ticketRepository.js`
- `backend/src/repositories/settingsRepository.js`
- `backend/src/routes/buildingRoutes.js`
- `backend/src/routes/roomRoutes.js`
- `backend/src/routes/contractRoutes.js`
- `backend/src/routes/invoiceRoutes.js`
- `backend/src/routes/ticketRoutes.js`
- `backend/src/routes/settingsRoutes.js`
- `backend/src/routes/dashboardRoutes.js`
- `backend/src/routes/exportRoutes.js`
- `backend/src/middleware/upload.js` - Multer configuration
- `backend/src/middleware/pagination.js` - Pagination helper
- `backend/src/utils/imageProcessor.js` - Sharp image processing
- `backend/src/utils/excelGenerator.js` - Excel export logic

### Modify
- `backend/src/routes/index.js` - Register new routes
- `backend/server.js` - Add upload folder serving
- `backend/package.json` - Add multer, sharp, exceljs dependencies

## Implementation Steps

### Week 1: Core Entities (Buildings, Rooms, Contracts)

1. **Install dependencies**
   ```bash
   npm install multer sharp exceljs
   ```

2. **Create buildings API**
   - Repository: findByTenant, findById, create, update, delete
   - Service: validateBuildingName, checkDuplicates, business logic
   - Controller: GET, POST, PUT, DELETE /api/buildings
   - Validation: buildingSchema (name required, floors 1-200)
   - Routes: Apply auth + tenantContext + validation middleware

3. **Create rooms API**
   - Repository: findByTenant, findByBuilding, findById, create, update, delete
   - Service: validateRoomNumber, checkAvailability, updateStatus
   - Controller: GET, POST, PUT, DELETE /api/rooms
   - Filters: ?building_id=&status=vacant|occupied|maintenance
   - Validation: roomSchema (room_number, price, area)

4. **Implement room image upload**
   - Middleware: multer configuration (max 5MB, jpg/png only)
   - Image processing: sharp resize to 1200x800, quality 80%
   - Storage: Save to `uploads/rooms/{tenant_id}/{room_id}.jpg`
   - Endpoint: POST /api/rooms/:id/image
   - Update room.image_url in database

5. **Create contracts API**
   - Repository: findByTenant, findByRoom, findActiveContracts, create, update, delete
   - Service: validateDates (start < end), checkRoomAvailability, calculateDeposit
   - Controller: GET, POST, PUT, DELETE /api/contracts
   - Business logic: 
     - Mark room as 'occupied' when contract created
     - Mark room as 'vacant' when contract expires/terminated
   - Filters: ?status=active|expired|terminated&room_id=

### Week 2: Invoices & Maintenance

6. **Create invoices API**
   - Repository: findByTenant, findByRoom, findByStatus, create, update, delete
   - Service: calculateTotal, validateLineItems, updatePaymentStatus
   - Controller: GET, POST, PUT, DELETE /api/invoices
   - Filters: ?status=unpaid|paid|overdue&month=&year=
   - Validation: invoiceSchema (month, year, due_date, line items)

7. **Implement invoice line items**
   - Repository: createLineItem, updateLineItem, deleteLineItem
   - Service: calculateLineTotal (quantity × unit_price)
   - Endpoint: POST /api/invoices/:id/items
   - Auto-calculate invoice total when items added

8. **Create batch invoice generation**
   - Endpoint: POST /api/invoices/batch
   - Business logic:
     - Find all active contracts
     - Create invoice for each contract
     - Add line items: rent, electric (old_index - new_index × price), water, service fee
     - Send in request: { month, year, meter_readings: [{room_id, electric, water}] }
   - Return: Array of created invoices

9. **Implement meter readings update**
   - Endpoint: PUT /api/invoices/:id/meters
   - Update invoice_items old_index, new_index
   - Recalculate totals

10. **Create maintenance tickets API**
    - Repository: findByTenant, findByStatus, create, update, delete
    - Service: assignTicket, resolveTicket, calculateCost
    - Controller: GET, POST, PUT, DELETE /api/tickets
    - Filters: ?status=reported|in_progress|resolved&room_id=
    - Status transitions: reported → in_progress → resolved

### Week 3: Settings, Dashboard, Export

11. **Create settings API**
    - Repository: findByTenantAndBuilding, createOrUpdate
    - Service: validatePrices (must be positive)
    - Controller: GET, PUT /api/settings
    - Query: ?building_id= (required)
    - Schema: base_rent, electric_price, water_price, service_fee, bank info

12. **Implement dashboard statistics**
    - Endpoint: GET /api/dashboard/stats
    - Calculate:
      - Total revenue (sum of paid invoices, current month)
      - Total expenses (sum of maintenance costs, current month)
      - Profit (revenue - expenses)
      - Occupancy rate (occupied rooms / total rooms)
      - Expiring contracts (end_date within 30 days)
      - Overdue invoices (due_date < today, status unpaid)
    - Response:
      ```json
      {
        "revenue": { "total": 50000000, "month": 10000000, "trend": "+5%" },
        "expenses": { "total": 8000000, "breakdown": {"maintenance": 5000000, "utilities": 3000000} },
        "profit": 2000000,
        "occupancy": { "occupied": 45, "vacant": 5, "rate": 90 },
        "alerts": {
          "expiring_contracts": 3,
          "overdue_invoices": 2
        }
      }
      ```

13. **Implement Excel export**
    - Endpoint: GET /api/export/excel
    - Use exceljs to create workbook
    - Sheets: Buildings, Rooms, Contracts, Invoices, Maintenance
    - Include all tenant data
    - Set headers, column widths, formatting
    - Return file download response

14. **Add pagination middleware**
    - Default: 50 items per page
    - Query params: ?page=1&limit=50
    - Response meta: { total, page, pages, hasNext, hasPrev }
    - Apply to all list endpoints

15. **Add audit logging**
    - Create auditLogRepository
    - Log all CREATE, UPDATE, DELETE operations
    - Store: user_id, action, entity_type, entity_id, changes (JSONB), ip_address
    - Call from service layer after successful operation

## Success Criteria

### Functional - Buildings
- [ ] GET /api/buildings returns all buildings for tenant
- [ ] POST /api/buildings creates new building
- [ ] PUT /api/buildings/:id updates building
- [ ] DELETE /api/buildings/:id deletes building
- [ ] Duplicate building names rejected with 409 Conflict

### Functional - Rooms
- [ ] GET /api/rooms?building_id= returns filtered rooms
- [ ] GET /api/rooms?status=vacant returns only vacant rooms
- [ ] POST /api/rooms creates new room
- [ ] PUT /api/rooms/:id updates room
- [ ] DELETE /api/rooms/:id deletes room
- [ ] POST /api/rooms/:id/image uploads and resizes image
- [ ] Image URL returned in room response

### Functional - Contracts
- [ ] GET /api/contracts?status=active returns active contracts
- [ ] POST /api/contracts creates contract and marks room occupied
- [ ] PUT /api/contracts/:id updates contract
- [ ] DELETE /api/contracts/:id terminates contract and marks room vacant
- [ ] Contract end_date must be after start_date

### Functional - Invoices
- [ ] GET /api/invoices?month=6&year=2026 returns filtered invoices
- [ ] POST /api/invoices creates invoice with line items
- [ ] POST /api/invoices/batch generates invoices for all active contracts
- [ ] PUT /api/invoices/:id/status marks invoice as paid
- [ ] PUT /api/invoices/:id/meters updates meter readings
- [ ] Invoice total auto-calculated from line items

### Functional - Maintenance
- [ ] GET /api/tickets?status=reported returns open tickets
- [ ] POST /api/tickets creates maintenance ticket
- [ ] PUT /api/tickets/:id updates ticket status
- [ ] DELETE /api/tickets/:id deletes ticket

### Functional - Settings & Dashboard
- [ ] GET /api/settings?building_id= returns settings
- [ ] PUT /api/settings updates pricing configuration
- [ ] GET /api/dashboard/stats returns accurate statistics
- [ ] Dashboard queries optimized (<500ms response time)

### Functional - Export
- [ ] GET /api/export/excel downloads Excel file
- [ ] Excel contains all tenant data in separate sheets
- [ ] Excel file opens without errors

### Non-Functional
- [ ] All endpoints enforce tenant isolation (tested)
- [ ] Pagination works on all list endpoints
- [ ] Search filters work correctly
- [ ] Image upload limited to 5MB
- [ ] Images resized to 1200x800
- [ ] Response times <500ms for 95th percentile
- [ ] Audit logs created for all mutations

### Testing
- [ ] CRUD tests for all entities pass
- [ ] Batch invoice generation tested with 50 contracts
- [ ] Tenant isolation verified (user A can't see user B's data)
- [ ] File upload tested with various image formats
- [ ] Excel export tested with large datasets (1000+ records)
- [ ] Dashboard statistics accuracy verified

## Risk Assessment

### High Risks

**1. Batch invoice generation too slow**
- **Mitigation:** Use database transactions, process in batches of 100
- **Impact:** Timeout on large tenant datasets
- **Probability:** Medium (if >500 contracts)

**2. Image upload DoS attack**
- **Mitigation:** Rate limit (5 uploads/min), max file size 5MB, virus scan
- **Impact:** Server storage exhausted
- **Probability:** Low (rate limiting in place)

**3. Excel export crashes on large datasets**
- **Mitigation:** Stream data instead of loading all in memory, limit to 10,000 rows
- **Impact:** API timeout, memory crash
- **Probability:** Medium (if tenant has >10K records)

### Medium Risks

**4. Complex queries slow down dashboard**
- **Mitigation:** Add database indexes, cache results in Redis (future)
- **Impact:** Slow page load, poor UX
- **Probability:** Medium (multiple aggregations)

**5. Concurrent edits cause data inconsistency**
- **Mitigation:** Use database transactions, optimistic locking (version field)
- **Impact:** Lost updates
- **Probability:** Low (small user base)

## Validation Checklist

Before proceeding to Phase 3:

- [ ] All 30+ API endpoints functional
- [ ] Tenant isolation tested (no cross-tenant access)
- [ ] File upload and image processing working
- [ ] Excel export generates valid files
- [ ] Dashboard statistics accurate
- [ ] Batch invoice generation tested
- [ ] Pagination works correctly
- [ ] Audit logs created for mutations
- [ ] Integration tests pass (80%+ coverage)
- [ ] Postman collection or OpenAPI spec documented
- [ ] No N+1 query issues (check with query logging)

## Dependencies for Next Phase

Phase 3 (Frontend Migration) requires:
- All API endpoints functional and tested
- Postman collection or API documentation available
- CORS configured to allow frontend origin
- Image URLs accessible from frontend
- Excel export endpoint working
