# Codebase Summary

**Project:** QUAN-LY-CHDV  
**Version:** 0.1.0-alpha (MVP)  
**Last Updated:** June 16, 2026  
**Total Lines of Code:** ~4,900 LOC  
**File Count:** 30 source files

---

## Technology Stack Breakdown

### Core Framework
- **React 19.2.6** - Latest React with concurrent features
- **Vite 8.0.12** - Next-generation build tool (replaces Webpack)
- **React Router DOM** - Client-side routing library

### UI Libraries
- **Lucide React** - 1,000+ open-source icons
- **Recharts 3.8.1** - Composable charting library built on D3
- **React Hot Toast 2.6.0** - Lightweight toast notifications
- **@hello-pangea/dnd 18.0.1** - Drag-and-drop (Kanban board)

### Data & Export
- **XLSX 0.20.3** - Excel export functionality
- **Firebase 12.14.0** - Authentication SDK (to be removed)

### Development Tools
- **ESLint 10.3.0** - Code linting with React rules
- **Vite Plugin React 6.0.1** - Fast refresh and JSX transform

---

## Project Structure

```
quan-ly-chdv/
├── public/                      # Static assets
│   ├── vite.svg
│   └── favicon.ico
├── src/
│   ├── assets/                  # Images and media
│   │   └── react.svg
│   ├── components/              # Reusable UI components (13 files)
│   │   ├── BottomTabBar.jsx     # Mobile navigation (95 LOC)
│   │   ├── Card.jsx             # Card wrapper (25 LOC)
│   │   ├── CreateInvoiceModal.jsx (420 LOC)
│   │   ├── ErrorBoundary.jsx    # Error handling (45 LOC)
│   │   ├── GeneratePeriodicInvoicesModal.jsx (380 LOC)
│   │   ├── Header.jsx           # Top navigation (150 LOC)
│   │   ├── InvoiceReceiptModal.jsx (480 LOC)
│   │   ├── ReportIssueModal.jsx # Maintenance form (245 LOC)
│   │   ├── RoomDetailDrawer.jsx # Sidebar panel (520 LOC)
│   │   ├── Sidebar.jsx          # Main navigation (180 LOC)
│   │   ├── StatusBadge.jsx      # Status indicator (35 LOC)
│   │   ├── TenantDetailDrawer.jsx (415 LOC)
│   │   └── UpdateIndexModal.jsx # Meter reading form (280 LOC)
│   ├── context/                 # React Context providers (2 files)
│   │   ├── AppDataContext.jsx   # Main data store (340 LOC)
│   │   └── AuthContext.jsx      # Authentication (120 LOC)
│   ├── pages/                   # Route components (10 files)
│   │   ├── Contracts.jsx        # Lease management (220 LOC)
│   │   ├── FinanceAndTenants.jsx # Analytics (85 LOC)
│   │   ├── Home.jsx             # Dashboard (450 LOC)
│   │   ├── Invoices.jsx         # Billing (580 LOC)
│   │   ├── Login.jsx            # Auth page (380 LOC)
│   │   ├── Maintenance.jsx      # Kanban board (650 LOC)
│   │   ├── Rooms.jsx            # Inventory (710 LOC)
│   │   ├── Settings.jsx         # Configuration (410 LOC)
│   │   ├── TenantPortal.jsx     # Resident view (380 LOC)
│   │   └── Tenants.jsx          # Resident profiles (660 LOC)
│   ├── styles/                  # Global stylesheets (2 files)
│   │   ├── Maintenance.css      # Kanban board styles
│   │   └── RoomDetailDrawer.css # Sidebar styles
│   ├── utils/                   # Helper functions (2 files)
│   │   ├── exportExcel.js       # XLSX generation (180 LOC)
│   │   └── mockData.js          # Sample data (85 LOC)
│   ├── App.jsx                  # Main app component (150 LOC)
│   ├── App.css                  # Global app styles (90 LOC)
│   ├── firebase.js              # Firebase config (25 LOC)
│   ├── index.css                # Root styles (70 LOC)
│   └── main.jsx                 # Entry point (10 LOC)
├── eslint.config.js             # Linter configuration
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.js               # Vite configuration
└── vercel.json                  # Deployment config

Total: 30 source files, ~4,900 LOC
```

---

## Key Components Overview

### Context Providers

**AppDataContext.jsx** (340 LOC)
- Central data store for all entities
- Manages 6 localStorage keys
- CRUD operations: add, update, delete
- State: rooms, tenants, contracts, invoices, tickets, settings

```javascript
const AppDataContext = createContext();

function AppDataProvider({ children }) {
  // State management for 6 entities
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState({ reported: [], inProgress: [], resolved: [] });
  const [settings, setSettings] = useState({});

  // CRUD functions
  const addRoom = (room) => { /* ... */ };
  const updateRoom = (id, updates) => { /* ... */ };
  const deleteRoom = (id) => { /* ... */ };
  // ... (repeat for other entities)

  return (
    <AppDataContext.Provider value={{ rooms, addRoom, updateRoom, ... }}>
      {children}
    </AppDataContext.Provider>
  );
}
```

**AuthContext.jsx** (120 LOC)
- Firebase authentication wrapper
- User session management
- Login/logout functions
- Role detection (manager vs tenant)

---

### Page Components

**Home.jsx** - Dashboard (450 LOC)
- Financial overview cards (revenue, expenses, profit)
- Occupancy rate calculation
- Monthly revenue trend chart (Recharts)
- Recent invoices table
- Alerts: expiring contracts, overdue invoices

**Rooms.jsx** - Room Management (710 LOC)
- Room grid with building tabs (A, B, C)
- Floor-based filtering
- Status indicators (vacant, occupied, maintenance)
- Create/edit room modal
- Room detail drawer with tenant info
- Responsive grid layout (1-4 columns)

**Tenants.jsx** - Resident Management (660 LOC)
- Tenant list with search
- Building/room filtering
- Create/edit tenant form
- Tenant detail drawer
- View contracts and invoices per tenant
- Move-in/move-out tracking

**Contracts.jsx** - Lease Management (220 LOC)
- Active contracts table
- Status filtering (active, expired, terminated)
- Contract expiry alerts
- Create/edit contract form
- Auto-calculate end date from start date + duration

**Invoices.jsx** - Billing Management (580 LOC)
- Invoice list with status badges
- Month/year filtering
- Create single invoice
- Batch generate invoices (modal)
- Update meter readings
- Mark as paid/unpaid
- View invoice receipt with VietQR
- Export to Excel

**Maintenance.jsx** - Ticket Tracking (650 LOC)
- Kanban board (3 columns: Reported, In Progress, Resolved)
- Drag-and-drop ticket movement (@hello-pangea/dnd)
- Create ticket modal with image upload
- View ticket details
- Cost tracking
- Category filtering (plumbing, electrical, etc.)

**Settings.jsx** - Configuration (410 LOC)
- Per-building pricing configuration
- Base costs (what manager pays)
- Collection prices (what tenants pay)
- Bank account details for VietQR
- Save settings to localStorage

**TenantPortal.jsx** - Resident View (380 LOC)
- Simplified view for tenant users
- View personal invoices only
- View assigned room info
- Submit maintenance requests
- View payment history

**Login.jsx** - Authentication (380 LOC)
- Email/password login form
- Manager vs Tenant toggle
- Demo data wipe functionality (to be removed)
- Hardcoded demo credentials (security issue)

**FinanceAndTenants.jsx** - Analytics (85 LOC)
- Placeholder for advanced analytics
- Revenue vs expenses comparison
- Tenant demographics (future)

---

### Reusable Components

**Header.jsx** (150 LOC)
- Top navigation bar
- User profile dropdown
- Logout button
- Breadcrumb navigation

**Sidebar.jsx** (180 LOC)
- Left navigation menu
- Icons from Lucide React
- Active route highlighting
- Role-based menu items (hide Settings for tenants)

**BottomTabBar.jsx** (95 LOC)
- Mobile-only navigation (<768px)
- 5 quick access icons
- Fixed bottom position

**RoomDetailDrawer.jsx** (520 LOC)
- Slide-in panel from right
- Room details (area, price, status)
- Current tenant info
- Inline editing (new feature)
- Contract and invoice history

**TenantDetailDrawer.jsx** (415 LOC)
- Tenant profile view
- Contact information
- Emergency contact
- Linked contracts and invoices

**CreateInvoiceModal.jsx** (420 LOC)
- Manual invoice creation form
- Line items: rent, electricity, water, service fee
- Meter reading inputs (old → new)
- Auto-calculate total
- Discount field
- Due date picker

**GeneratePeriodicInvoicesModal.jsx** (380 LOC)
- Batch invoice generation
- Select month/year
- Preview list of rooms to invoice
- One-click generation for all occupied rooms
- Uses current meter readings

**InvoiceReceiptModal.jsx** (480 LOC)
- Invoice details view
- Line-by-line breakdown
- VietQR code generation
- Print functionality (CSS @media print)
- Bank transfer instructions

**UpdateIndexModal.jsx** (280 LOC)
- Update meter readings for a room
- Electricity and water inputs
- Historical readings table
- Save to invoice

**ReportIssueModal.jsx** (245 LOC)
- Tenant-facing maintenance request form
- Category dropdown
- Description textarea
- Photo upload (future)
- Priority selection

**StatusBadge.jsx** (35 LOC)
- Color-coded status indicators
- Variants: success, warning, danger, info
- Used for: room status, invoice status, ticket status

**Card.jsx** (25 LOC)
- Simple card wrapper with shadow
- Used in dashboard for stat cards

**ErrorBoundary.jsx** (45 LOC)
- React error boundary
- Catches component errors
- Shows fallback UI instead of white screen

---

## Data Flow Architecture

### Current localStorage Schema

**rentflow_rooms**
```json
[
  {
    "id": "uuid",
    "name": "A101",
    "floor": 1,
    "status": "occupied",
    "building": "A",
    "area": 25,
    "price": 3000000,
    "image": "url"
  }
]
```

**rentflow_tenants**
```json
[
  {
    "id": "uuid",
    "name": "Nguyen Van A",
    "roomId": "uuid",
    "phone": "0901234567",
    "email": "tenant@example.com",
    "idNumber": "012345678901",
    "emergencyContact": "0909876543",
    "moveInDate": "2024-01-01"
  }
]
```

**rentflow_contracts**
```json
[
  {
    "id": "uuid",
    "roomId": "uuid",
    "tenantId": "uuid",
    "number": "HD-2024-001",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "rent": 3000000,
    "deposit": 6000000,
    "status": "active"
  }
]
```

**rentflow_invoices**
```json
[
  {
    "id": "uuid",
    "roomId": "uuid",
    "tenantId": "uuid",
    "contractId": "uuid",
    "month": 6,
    "year": 2024,
    "rent": 3000000,
    "electricityPrevious": 100,
    "electricityCurrent": 150,
    "electricityPrice": 3500,
    "waterPrevious": 10,
    "waterCurrent": 15,
    "waterPrice": 100000,
    "serviceFee": 150000,
    "discount": 0,
    "total": 3825000,
    "status": "unpaid",
    "dueDate": "2024-06-05"
  }
]
```

**rentflow_tickets**
```json
{
  "reported": [
    {
      "id": "uuid",
      "roomId": "uuid",
      "tenantId": "uuid",
      "title": "Sink leaking",
      "description": "Water dripping from pipe",
      "category": "plumbing",
      "priority": "high",
      "cost": 0,
      "createdAt": "2024-06-16T10:00:00Z"
    }
  ],
  "inProgress": [],
  "resolved": []
}
```

**rentflow_settings**
```json
{
  "buildings": ["A", "B", "C"],
  "floors": [4, 4, 3],
  "prices": {
    "A": {
      "baseRent": 30000000,
      "baseElectricityPrice": 2500,
      "baseWaterPrice": 50000,
      "electricityPrice": 3500,
      "waterPrice": 100000,
      "serviceFee": 150000,
      "bankName": "MB",
      "bankAccount": "0901234567",
      "bankOwner": "NGUYEN VAN A"
    }
  }
}
```

---

## State Management Pattern

### Context API Pattern

```
App.jsx (Root)
  └── AuthContext.Provider
      └── AppDataContext.Provider
          └── Router
              ├── Login (public route)
              └── Layout (protected routes)
                  ├── Header
                  ├── Sidebar
                  └── Page Components
                      ├── Home
                      ├── Rooms
                      ├── Tenants
                      ├── Contracts
                      ├── Invoices
                      ├── Maintenance
                      ├── Settings
                      └── TenantPortal
```

### Data Flow Example (Create Room)

```
1. User fills form in Rooms.jsx
2. User clicks "Save"
3. Call: addRoom({ name: "A101", ... })
4. AppDataContext.addRoom() updates state
5. localStorage.setItem('rentflow_rooms', JSON.stringify(newRooms))
6. React re-renders Rooms component
7. New room appears in grid
```

---

## Routing Structure

```javascript
// src/App.jsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="finance" element={<FinanceAndTenants />} />
        <Route path="settings" element={<Settings />} />
        <Route path="tenant-portal" element={<TenantPortal />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
```

**Route Guards:**
- `/login` - Public route
- All other routes - Protected (requires authentication)
- `/settings` - Hidden from tenant users (UI only, not enforced)

---

## Styling Approach

### CSS Organization
- **Global Styles:** `src/index.css`, `src/App.css`
- **Component Styles:** Inline (via `style` prop)
- **Scoped CSS:** `Maintenance.css`, `RoomDetailDrawer.css`

### CSS Variables (index.css)
```css
:root {
  --primary-color: #3b82f6;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --bg-gray: #f9fafb;
}
```

### Responsive Breakpoints
- **Mobile:** <768px (BottomTabBar visible)
- **Tablet:** 768px-1024px (Sidebar collapsed)
- **Desktop:** >1024px (Full layout)

---

## Code Patterns

### Component Structure
```javascript
import React, { useState, useContext } from 'react';
import { AppDataContext } from '../context/AppDataContext';
import toast from 'react-hot-toast';

function ComponentName() {
  // 1. Context hooks
  const { rooms, addRoom } = useContext(AppDataContext);
  
  // 2. Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  
  // 3. Event handlers
  const handleSubmit = () => {
    addRoom(formData);
    toast.success('Room created');
    setIsModalOpen(false);
  };
  
  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

### Common Patterns
- **Modal Management:** `const [isOpen, setIsOpen] = useState(false)`
- **Form Handling:** `const [formData, setFormData] = useState({})`
- **Toast Notifications:** `toast.success()`, `toast.error()`
- **Conditional Rendering:** `{condition && <Component />}`
- **List Rendering:** `{items.map(item => <Item key={item.id} />)}`

---

## Dependencies Breakdown

### Production Dependencies (10 packages)
```json
{
  "@hello-pangea/dnd": "^18.0.1",      // 89 KB - Drag and drop
  "firebase": "^12.14.0",              // 312 KB - Auth (unused)
  "lucide-react": "latest",            // 1.2 MB - Icons
  "react": "^19.2.6",                  // 130 KB - Core
  "react-dom": "^19.2.6",              // 130 KB - DOM
  "react-hot-toast": "^2.6.0",         // 18 KB - Notifications
  "react-router-dom": "latest",        // 53 KB - Routing
  "recharts": "^3.8.1",                // 890 KB - Charts
  "xlsx": "0.20.3"                     // 1.8 MB - Excel
}
```

### Dev Dependencies (8 packages)
```json
{
  "@eslint/js": "^10.0.1",
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^6.0.1",
  "eslint": "^10.3.0",
  "eslint-plugin-react-hooks": "^7.1.1",
  "eslint-plugin-react-refresh": "^0.5.2",
  "globals": "^17.6.0",
  "vite": "^8.0.12"
}
```

**Bundle Size (Production):**
- Uncompressed: ~4.5 MB
- Gzipped: ~1.2 MB
- Largest: XLSX (1.8 MB), Lucide (1.2 MB), Recharts (890 KB)

---

## Entry Points

### main.jsx (Application Bootstrap)
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### App.jsx (Root Component)
```javascript
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Routes from './routes';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppDataProvider>
            <Routes />
            <Toaster position="top-right" />
          </AppDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
```

---

## Known Issues and Technical Debt

### Critical Issues
1. **Firebase credentials exposed** in `firebase.js`
2. **Hardcoded passwords** in `Login.jsx`
3. **No backend** - localStorage only
4. **Client-side auth** - role checking can be bypassed
5. **No input validation** - XSS and injection risks
6. **No multi-tenancy** - single user per browser

### High Priority Issues
1. **Large component files** - Rooms.jsx (710 LOC), Maintenance.jsx (650 LOC)
2. **Mixed patterns** - Some use Context, others direct state
3. **No error handling** - CRUD operations don't catch errors
4. **No loading states** - Instant UI updates (localStorage fast)
5. **Unused Firebase** - Auth SDK imported but not fully used
6. **CSS organization** - Mix of inline styles and separate files

### Medium Priority Issues
1. **No TypeScript** - Prone to runtime errors
2. **No tests** - 0% coverage
3. **No API documentation** - Internal functions not documented
4. **Magic numbers** - Hardcoded values (floor counts, page sizes)
5. **Inconsistent naming** - camelCase vs PascalCase in places

---

## Migration Recommendations

### Phase 1: Refactoring (Before API Integration)
1. Extract large components (split Rooms.jsx, Maintenance.jsx)
2. Create shared form components (FormInput, FormSelect)
3. Standardize error handling (try-catch wrapper)
4. Add loading states (prepare for network latency)
5. Remove unused Firebase imports

### Phase 2: API Integration
1. Create `src/services/api.js` - axios client
2. Replace Context CRUD methods with API calls
3. Add error handling and retries
4. Implement optimistic UI updates
5. Add pagination (currently loads all data)

### Phase 3: Testing
1. Add Vitest for unit tests
2. Test utility functions (exportExcel, invoice calculations)
3. Test React components (React Testing Library)
4. Add E2E tests (Playwright)

---

## Related Documents

- `docs/project-overview-pdr.md` - Product requirements
- `docs/system-architecture.md` - Technical architecture
- `docs/code-standards.md` - Development conventions
- `docs/deployment-guide.md` - Production deployment

---

**Document Owner:** Development Team  
**Last Updated:** June 16, 2026  
**Next Review:** After Phase 3 (Frontend Migration)
