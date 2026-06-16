---
phase: 3
title: "Frontend Migration"
status: pending
priority: P1
effort: "2 weeks"
dependencies: [2]
---

# Phase 3: Frontend Migration

## Overview

Migrate React frontend from localStorage persistence to backend API integration. Replace Context API CRUD functions with API calls, implement proper loading states, error handling, and authentication flow.

**Duration:** 2 weeks  
**Team:** 1-2 frontend developers  
**Deliverables:** Fully API-integrated frontend with no localStorage, auth flow, optimistic updates

## Requirements

### Functional
- Replace all localStorage persistence with API calls
- Implement axios-based API client with JWT interceptor
- Auth flow: login, logout, token refresh, redirect on 401
- Loading states for all async operations
- Error handling with toast notifications
- Optimistic UI updates (show change immediately, revert on error)
- Image upload from RoomDetailDrawer
- Excel export download from dashboard

### Non-Functional
- API calls have loading indicators
- Errors displayed with user-friendly messages
- Token refresh automatic on 401 Unauthorized
- Auto-redirect to /login if not authenticated
- Form submissions disabled during API calls
- Image previews before upload
- Network error recovery (retry failed requests)

## Architecture

### API Client Structure

```
src/
├── services/
│   ├── api.js              # Axios instance with interceptors
│   ├── authService.js      # Auth API calls
│   ├── buildingService.js  # Buildings API
│   ├── roomService.js      # Rooms API
│   ├── contractService.js  # Contracts API
│   ├── invoiceService.js   # Invoices API
│   └── ...
├── contexts/
│   ├── AuthContext.jsx     # Auth state (replace with API)
│   └── AppDataContext.jsx  # Data state (replace with API)
├── hooks/
│   ├── useAuth.js          # Auth hook
│   ├── useBuildings.js     # Buildings data hook
│   └── ...
```

### Data Flow

**Before (localStorage):**
```
Component → Context → localStorage
```

**After (API):**
```
Component → Service → axios → Backend API → PostgreSQL
```

### Authentication Flow

```
Login
  ↓
Store access token in memory
  ↓
Store refresh token in httpOnly cookie (automatic)
  ↓
Access protected route
  ↓
axios interceptor adds Authorization header
  ↓
If 401 Unauthorized → Call refresh endpoint
  ↓
If refresh fails → Redirect to /login
```

## Related Code Files

### Create
- `frontend/src/services/api.js` - Axios client with interceptors
- `frontend/src/services/authService.js` - Auth API calls
- `frontend/src/services/buildingService.js` - Buildings API
- `frontend/src/services/roomService.js` - Rooms API
- `frontend/src/services/contractService.js` - Contracts API
- `frontend/src/services/invoiceService.js` - Invoices API
- `frontend/src/services/ticketService.js` - Maintenance API
- `frontend/src/services/settingsService.js` - Settings API
- `frontend/src/services/dashboardService.js` - Dashboard API
- `frontend/src/hooks/useAuth.js` - Auth custom hook
- `frontend/src/hooks/useBuildings.js` - Buildings data hook
- `frontend/src/hooks/useRooms.js` - Rooms data hook
- `frontend/src/utils/errorHandler.js` - Error message mapping

### Modify
- `frontend/src/contexts/AuthContext.jsx` - Replace localStorage with API
- `frontend/src/contexts/AppDataContext.jsx` - Replace CRUD with API calls
- `frontend/src/pages/Login.jsx` - Call login API, remove hardcoded password
- `frontend/src/components/RoomDetailDrawer.jsx` - Image upload API
- `frontend/src/pages/Dashboard.jsx` - Fetch stats from API
- `frontend/src/pages/Buildings.jsx` - Replace Context with API hooks
- `frontend/src/pages/Rooms.jsx` - Replace Context with API hooks
- `frontend/src/pages/Contracts.jsx` - Replace Context with API hooks
- `frontend/src/pages/Invoices.jsx` - Replace Context with API hooks
- `frontend/src/pages/Maintenance.jsx` - Replace Context with API hooks
- `frontend/src/pages/Settings.jsx` - Replace Context with API hooks
- `frontend/.env.example` - Add VITE_API_BASE_URL

### Delete
- All localStorage persistence code in Context providers
- Hardcoded demo data and seed functions
- Firebase imports and configuration

## Implementation Steps

### Week 1: API Client + Auth Integration

1. **Create axios API client**
   ```bash
   npm install axios
   ```
   - Create `services/api.js`:
     - Base URL from env: `VITE_API_BASE_URL`
     - Request interceptor: Add Authorization header if token exists
     - Response interceptor: Handle 401 (refresh token), network errors
   - Store access token in memory (React state)
   - Refresh token stored in httpOnly cookie (automatic from backend)

2. **Implement auth service**
   - Create `services/authService.js`:
     - `login(email, password)` → POST /api/auth/login
     - `logout()` → POST /api/auth/logout
     - `register(data)` → POST /api/auth/register
     - `getCurrentUser()` → GET /api/auth/me
     - `refreshToken()` → POST /api/auth/refresh
     - `changePassword(currentPassword, newPassword)` → PUT /api/auth/password

3. **Replace AuthContext with API**
   - Remove localStorage auth state
   - Call authService.login() on login
   - Store access token in context state
   - Call authService.getCurrentUser() on app mount
   - Implement token refresh on 401 response
   - Redirect to /login if refresh fails

4. **Update Login page**
   - Remove hardcoded password check
   - Call authService.login(email, password)
   - Show loading spinner during API call
   - Display error toast if login fails
   - Redirect to dashboard on success

5. **Implement protected routes**
   - Create ProtectedRoute component
   - Check if user authenticated (token exists)
   - Redirect to /login if not authenticated
   - Wrap all dashboard routes with ProtectedRoute

### Week 2: Data Integration + Features

6. **Create service layer for all entities**
   - `buildingService.js`: getAll, getById, create, update, delete
   - `roomService.js`: getAll, getByBuilding, create, update, delete, uploadImage
   - `contractService.js`: getAll, create, update, delete
   - `invoiceService.js`: getAll, create, update, delete, generateBatch, updateMeters
   - `ticketService.js`: getAll, create, update, delete
   - `settingsService.js`: get, update
   - `dashboardService.js`: getStats

7. **Replace AppDataContext CRUD functions**
   - Remove localStorage persistence
   - Replace `addBuilding` → `buildingService.create()`
   - Replace `updateBuilding` → `buildingService.update()`
   - Replace `deleteBuilding` → `buildingService.delete()`
   - Repeat for all entities (rooms, contracts, invoices, tickets)

8. **Implement optimistic UI updates**
   - Show change immediately in UI
   - Call API in background
   - Revert if API call fails
   - Example: Delete room → Remove from list → Show loading → If fails, restore to list

9. **Add loading states**
   - Create loading state for each API call
   - Show spinner or skeleton loader during fetch
   - Disable forms during submission
   - Example: `const [loading, setLoading] = useState(false)`

10. **Implement error handling**
    - Create `utils/errorHandler.js`:
      - Map error codes to user-friendly messages
      - 400 → "Invalid input"
      - 401 → "Session expired, please login"
      - 403 → "Permission denied"
      - 404 → "Not found"
      - 500 → "Server error, please try again"
    - Display errors with react-hot-toast
    - Log errors to console for debugging

11. **Implement image upload**
    - In RoomDetailDrawer, add file input for image
    - Call `roomService.uploadImage(roomId, file)` on submit
    - Show preview before upload
    - Display upload progress (if API supports)
    - Update room.image_url in state after success

12. **Implement Excel export**
    - Add "Export to Excel" button in dashboard
    - Call `exportService.downloadExcel()`
    - Trigger browser download with `window.open()` or `<a download>`
    - Show loading spinner during export

13. **Add search and filters**
    - Buildings: Filter by name (client-side or API param)
    - Rooms: Filter by building, status (vacant/occupied)
    - Contracts: Filter by status (active/expired)
    - Invoices: Filter by month, year, status (unpaid/paid)
    - Tickets: Filter by status (reported/in_progress/resolved)

14. **Update dashboard stats**
    - Call `dashboardService.getStats()` on mount
    - Display revenue, expenses, profit
    - Show occupancy rate
    - Display alerts (expiring contracts, overdue invoices)

15. **Remove all localStorage code**
    - Search for `localStorage.setItem`, `localStorage.getItem`
    - Remove all instances
    - Remove seed data functions
    - Remove demo data wipe on login
    - Verify app works without localStorage

## Success Criteria

### Authentication
- [ ] Login page calls backend API
- [ ] Successful login stores token and redirects to dashboard
- [ ] Failed login displays error message
- [ ] Logout clears token and redirects to login
- [ ] Protected routes redirect to login if not authenticated
- [ ] Token refresh automatic on 401 response
- [ ] Session expired redirects to login with message

### Data Integration - Buildings
- [ ] Buildings list fetched from API on page load
- [ ] Create building calls API and updates UI
- [ ] Update building calls API and updates UI
- [ ] Delete building calls API and updates UI
- [ ] Loading spinner shown during API calls
- [ ] Errors displayed with toast notifications

### Data Integration - Rooms
- [ ] Rooms list fetched from API
- [ ] Filter by building works
- [ ] Filter by status (vacant/occupied) works
- [ ] Create room calls API
- [ ] Update room calls API
- [ ] Delete room calls API
- [ ] Image upload works and updates room.image_url

### Data Integration - Contracts
- [ ] Contracts list fetched from API
- [ ] Filter by status works
- [ ] Create contract calls API and marks room occupied
- [ ] Update contract calls API
- [ ] Delete contract calls API and marks room vacant

### Data Integration - Invoices
- [ ] Invoices list fetched from API
- [ ] Filter by month, year, status works
- [ ] Create invoice calls API
- [ ] Batch invoice generation works
- [ ] Update invoice calls API
- [ ] Mark as paid updates status
- [ ] Meter readings update works

### Data Integration - Maintenance
- [ ] Tickets list fetched from API
- [ ] Filter by status works
- [ ] Create ticket calls API
- [ ] Update ticket status calls API
- [ ] Delete ticket calls API

### Data Integration - Settings & Dashboard
- [ ] Settings fetched from API
- [ ] Update settings calls API
- [ ] Dashboard stats fetched from API
- [ ] Stats display accurate data
- [ ] Excel export downloads file

### UI/UX
- [ ] Loading states shown for all async operations
- [ ] Errors displayed with user-friendly messages
- [ ] Optimistic updates work (UI updates immediately)
- [ ] Forms disabled during submission
- [ ] Image previews shown before upload
- [ ] No localStorage code remains
- [ ] No console errors after integration

## Risk Assessment

### High Risks

**1. Token refresh fails, user logged out unexpectedly**
- **Mitigation:** Test refresh flow thoroughly, show "Session expired" message
- **Impact:** Poor UX, user loses unsaved work
- **Probability:** Low (if implemented correctly)

**2. API calls too slow, UI feels sluggish**
- **Mitigation:** Add loading states, optimize backend queries, consider caching
- **Impact:** Poor UX, user frustration
- **Probability:** Medium (depends on backend performance)

**3. Network errors cause app crash**
- **Mitigation:** Wrap all API calls in try-catch, handle network errors gracefully
- **Impact:** App unusable without internet
- **Probability:** Medium (unstable connections)

### Medium Risks

**4. Optimistic updates cause data inconsistency**
- **Mitigation:** Revert on API error, refresh data from server on mount
- **Impact:** UI shows stale data
- **Probability:** Low (if error handling correct)

**5. Image upload fails silently**
- **Mitigation:** Show error message, allow retry, log to console
- **Impact:** User thinks upload succeeded but image not saved
- **Probability:** Low (if validation in place)

## Validation Checklist

Before proceeding to Phase 4:

- [ ] Can login via API (no hardcoded password)
- [ ] All CRUD operations work via API
- [ ] No localStorage code remains
- [ ] Loading states shown for all async operations
- [ ] Errors handled gracefully
- [ ] Token refresh works automatically
- [ ] Protected routes redirect to login
- [ ] Image upload functional
- [ ] Excel export downloads file
- [ ] Dashboard stats accurate
- [ ] Search and filters work
- [ ] No console errors in browser
- [ ] Manual testing completed for all pages

## Dependencies for Next Phase

Phase 4 (Security Hardening) requires:
- Frontend fully integrated with backend
- All localStorage removed
- Auth flow working end-to-end
- Manual testing completed
- No regressions found
