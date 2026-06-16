# Code Standards

**Project:** QUAN-LY-CHDV  
**Version:** 1.0  
**Last Updated:** June 16, 2026  
**Applies To:** Frontend (React) and Backend (Node.js)

---

## Core Principles

### YAGNI (You Aren't Gonna Need It)
- Only implement features when required
- Avoid speculative functionality
- Delete unused code immediately

### KISS (Keep It Simple, Stupid)
- Prefer simple solutions over complex ones
- Avoid premature optimization
- Write code for clarity, not cleverness

### DRY (Don't Repeat Yourself)
- Extract repeated logic into functions
- Create reusable components
- Share code between frontend and backend where possible

---

## File Organization

### Frontend Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Input, Modal)
│   ├── layout/          # Layout components (Header, Sidebar)
│   └── domain/          # Business logic components (InvoiceCard)
├── pages/               # Route-level components
├── context/             # React Context providers
├── services/            # API client and business logic
├── utils/               # Pure helper functions
├── hooks/               # Custom React hooks
├── styles/              # Global and scoped CSS
├── constants/           # Configuration constants
└── types/               # TypeScript types (future)
```

### Backend Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/          # Database models/queries
│   ├── routes/          # Express route definitions
│   ├── middleware/      # Auth, validation, error handling
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── config/          # Configuration files
│   └── index.js         # Entry point
├── tests/               # Test files
├── migrations/          # Database migrations
└── scripts/             # Utility scripts
```

---

## Naming Conventions

### Files and Directories

**React Components:**
```
PascalCase.jsx           ✅ Header.jsx, RoomCard.jsx
camelCase.jsx            ❌ header.jsx, roomCard.jsx
kebab-case.jsx           ❌ room-card.jsx
```

**JavaScript Files:**
```
camelCase.js             ✅ exportExcel.js, authService.js
kebab-case.js            ✅ auth-service.js (acceptable)
PascalCase.js            ❌ ExportExcel.js (unless it exports a class)
```

**Directories:**
```
camelCase/               ✅ src/utils/, src/components/
kebab-case/              ✅ src/user-profile/ (acceptable)
PascalCase/              ❌ src/UserProfile/
```

### Variables and Functions

**Variables:**
```javascript
// camelCase for variables
const userName = 'John';
const isActive = true;
const roomCount = 10;

// UPPER_SNAKE_CASE for constants
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const API_BASE_URL = 'https://api.example.com';
```

**Functions:**
```javascript
// camelCase for functions
function calculateTotal() { }
const handleSubmit = () => { };

// Prefix boolean functions with is/has/should
function isValid() { return true; }
function hasPermission() { return false; }
function shouldUpdate() { return true; }
```

**React Components:**
```javascript
// PascalCase for components
function RoomCard() { }
const InvoiceTable = () => { };

// camelCase for custom hooks
function useAuth() { }
function useFetchRooms() { }
```

### Database Tables and Columns

**PostgreSQL:**
```sql
-- Table names: plural, lowercase with underscores
CREATE TABLE users ();
CREATE TABLE maintenance_tickets ();

-- Column names: lowercase with underscores
id UUID
user_id UUID
created_at TIMESTAMP
is_active BOOLEAN
```

---

## Component Patterns

### Functional Components (Preferred)

```javascript
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Room card component displaying room details
 * @param {Object} room - Room object with id, name, status
 * @param {Function} onEdit - Callback when edit button clicked
 */
function RoomCard({ room, onEdit }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onEdit(room.id);
  };

  return (
    <div 
      className="room-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3>{room.name}</h3>
      <p>Status: {room.status}</p>
      {isHovered && <button onClick={handleClick}>Edit</button>}
    </div>
  );
}

RoomCard.propTypes = {
  room: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default RoomCard;
```

### Component Organization

```javascript
// 1. Imports (grouped by type)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { AppDataContext } from '../context/AppDataContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

import './Component.css';

// 2. Constants
const MAX_ITEMS = 50;
const DEFAULT_STATUS = 'active';

// 3. Component
function ComponentName({ prop1, prop2 }) {
  // 3a. Hooks (in order: context, state, effects, custom)
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // 3b. Event handlers
  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      await api.create(formData);
      toast.success('Success');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 3c. Derived values
  const filteredData = data.filter(item => item.status === 'active');
  
  // 3d. Render helpers (optional)
  const renderItem = (item) => (
    <div key={item.id}>{item.name}</div>
  );
  
  // 3e. Early returns (loading, error states)
  if (isLoading) return <div>Loading...</div>;
  
  // 3f. Main render
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
}

// 4. PropTypes
ComponentName.propTypes = { /* ... */ };

// 5. Export
export default ComponentName;
```

---

## State Management

### Context API Pattern

**When to use Context:**
- Global state (auth, theme, app data)
- Deeply nested components need same data
- State shared across multiple routes

**When NOT to use Context:**
- Component-local state
- State only used in parent-child (use props)
- Frequently changing state (causes re-renders)

**Context Structure:**

```javascript
// src/context/AppDataContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const AppDataContext = createContext();

export function AppDataProvider({ children }) {
  const [rooms, setRooms] = useState([]);
  
  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('rentflow_rooms');
    if (stored) setRooms(JSON.parse(stored));
  }, []);
  
  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('rentflow_rooms', JSON.stringify(rooms));
  }, [rooms]);
  
  // CRUD operations
  const addRoom = (room) => {
    setRooms(prev => [...prev, { ...room, id: crypto.randomUUID() }]);
  };
  
  const updateRoom = (id, updates) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, ...updates } : room
    ));
  };
  
  const deleteRoom = (id) => {
    setRooms(prev => prev.filter(room => room.id !== id));
  };
  
  return (
    <AppDataContext.Provider value={{ rooms, addRoom, updateRoom, deleteRoom }}>
      {children}
    </AppDataContext.Provider>
  );
}

// Custom hook for consuming context
export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
}
```

### Local State Guidelines

```javascript
// ✅ Good: Descriptive names
const [isModalOpen, setIsModalOpen] = useState(false);
const [formData, setFormData] = useState({ name: '', email: '' });
const [selectedRoom, setSelectedRoom] = useState(null);

// ❌ Bad: Generic names
const [open, setOpen] = useState(false);
const [data, setData] = useState({});
const [selected, setSelected] = useState(null);

// ✅ Good: Derived state (compute from existing state)
const activeRooms = rooms.filter(room => room.status === 'occupied');
const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

// ❌ Bad: Redundant state (duplicates existing state)
const [activeRooms, setActiveRooms] = useState([]);
const [totalRevenue, setTotalRevenue] = useState(0);
```

---

## API Integration (Production)

### API Service Layer

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor (add JWT token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle token refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { data } = await axios.post('/api/auth/refresh');
        localStorage.setItem('access_token', data.accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const roomsAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/rooms/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
```

### Error Handling Pattern

```javascript
import toast from 'react-hot-toast';

async function handleCreateRoom(roomData) {
  try {
    setIsLoading(true);
    const { data } = await roomsAPI.create(roomData);
    setRooms(prev => [...prev, data]);
    toast.success('Room created successfully');
    setIsModalOpen(false);
  } catch (error) {
    // Handle different error types
    if (error.response?.status === 400) {
      toast.error(error.response.data.message || 'Invalid input');
    } else if (error.response?.status === 409) {
      toast.error('Room number already exists');
    } else {
      toast.error('Failed to create room. Please try again.');
      console.error('Create room error:', error);
    }
  } finally {
    setIsLoading(false);
  }
}
```

---

## Backend Patterns (Node.js + Express)

### Controller Pattern

```javascript
// src/controllers/rooms.controller.js
const { roomsModel } = require('../models');
const { AppError } = require('../utils/errors');

/**
 * Get all rooms for authenticated tenant
 * @route GET /api/rooms
 * @query {string} building_id - Optional building filter
 * @query {string} status - Optional status filter (vacant, occupied, maintenance)
 */
exports.getRooms = async (req, res, next) => {
  try {
    const { tenant_id } = req.user; // From JWT middleware
    const { building_id, status } = req.query;
    
    const rooms = await roomsModel.findAll({
      tenant_id,
      building_id,
      status,
    });
    
    res.json({
      success: true,
      data: rooms,
      count: rooms.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new room
 * @route POST /api/rooms
 * @body {object} room - Room data (validated by middleware)
 */
exports.createRoom = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const roomData = { ...req.body, tenant_id };
    
    // Check for duplicate room number
    const existing = await roomsModel.findByNumber(
      tenant_id,
      roomData.building_id,
      roomData.room_number
    );
    
    if (existing) {
      throw new AppError('Room number already exists in this building', 409);
    }
    
    const room = await roomsModel.create(roomData);
    
    res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully',
    });
  } catch (error) {
    next(error);
  }
};
```

### Model Pattern (PostgreSQL)

```javascript
// src/models/rooms.model.js
const { pool } = require('../config/database');

/**
 * Find all rooms with optional filters
 */
exports.findAll = async ({ tenant_id, building_id, status }) => {
  let query = 'SELECT * FROM rooms WHERE tenant_id = $1';
  const params = [tenant_id];
  
  if (building_id) {
    params.push(building_id);
    query += ` AND building_id = $${params.length}`;
  }
  
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  
  query += ' ORDER BY building_id, room_number';
  
  const { rows } = await pool.query(query, params);
  return rows;
};

/**
 * Create new room
 */
exports.create = async (roomData) => {
  const query = `
    INSERT INTO rooms (tenant_id, building_id, room_number, floor, area, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const { rows } = await pool.query(query, [
    roomData.tenant_id,
    roomData.building_id,
    roomData.room_number,
    roomData.floor,
    roomData.area,
    roomData.status || 'vacant',
  ]);
  
  return rows[0];
};
```

### Middleware Pattern

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

/**
 * Verify JWT token and attach user to request
 */
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return next(new AppError('Authentication required', 401));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { user_id, tenant_id, role }
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 403));
  }
};

/**
 * Require specific role
 */
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};
```

### Input Validation (Zod)

```javascript
// src/validators/rooms.validator.js
const { z } = require('zod');

exports.createRoomSchema = z.object({
  body: z.object({
    building_id: z.string().uuid('Invalid building ID'),
    room_number: z.string().min(1).max(20),
    floor: z.number().int().min(1).max(50),
    area: z.number().positive().optional(),
    status: z.enum(['vacant', 'occupied', 'maintenance']).optional(),
  }),
});

// Middleware to validate request
exports.validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }
  };
};
```

---

## Code Quality

### ESLint Rules

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'react/prop-types': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

### Code Comments

```javascript
// ✅ Good: Explain WHY, not WHAT
// Cache the calculated total to avoid recalculating on every render
const memoizedTotal = useMemo(() => calculateTotal(items), [items]);

// ❌ Bad: Comment states the obvious
// Loop through items
items.forEach(item => { /* ... */ });

// ✅ Good: JSDoc for functions
/**
 * Calculate invoice total including utilities and discounts
 * @param {Object} invoice - Invoice object with line items
 * @returns {number} Total amount in VND
 */
function calculateInvoiceTotal(invoice) { }

// ✅ Good: TODO comments with context
// TODO: Add pagination when room count exceeds 100
// Context: Currently loads all rooms, may cause performance issues at scale

// ❌ Bad: Vague TODOs
// TODO: Fix this
// TODO: Improve performance
```

---

## Testing Standards

### Unit Test Pattern (Jest/Vitest)

```javascript
// src/utils/calculateInvoiceTotal.test.js
import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotal } from './calculateInvoiceTotal';

describe('calculateInvoiceTotal', () => {
  it('should calculate total with rent only', () => {
    const invoice = {
      rent: 3000000,
      electricity: 0,
      water: 0,
      serviceFee: 0,
      discount: 0,
    };
    expect(calculateInvoiceTotal(invoice)).toBe(3000000);
  });
  
  it('should include utilities in total', () => {
    const invoice = {
      rent: 3000000,
      electricity: 175000, // 50 kWh × 3500
      water: 500000, // 5 m³ × 100000
      serviceFee: 150000,
      discount: 0,
    };
    expect(calculateInvoiceTotal(invoice)).toBe(3825000);
  });
  
  it('should apply discount correctly', () => {
    const invoice = {
      rent: 3000000,
      electricity: 0,
      water: 0,
      serviceFee: 0,
      discount: 300000,
    };
    expect(calculateInvoiceTotal(invoice)).toBe(2700000);
  });
});
```

### Component Test Pattern

```javascript
// src/components/RoomCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RoomCard from './RoomCard';

describe('RoomCard', () => {
  const mockRoom = {
    id: '123',
    name: 'A101',
    status: 'occupied',
  };
  
  it('renders room name', () => {
    render(<RoomCard room={mockRoom} onEdit={() => {}} />);
    expect(screen.getByText('A101')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button clicked', () => {
    const handleEdit = vi.fn();
    render(<RoomCard room={mockRoom} onEdit={handleEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(handleEdit).toHaveBeenCalledWith('123');
  });
});
```

---

## Git Workflow

### Commit Message Format (Conventional Commits)

```
type(scope): subject

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring (no behavior change)
- `style`: Formatting, missing semicolons (no code change)
- `docs`: Documentation only
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, config)

**Examples:**
```
feat(rooms): add image upload functionality

fix(invoices): correct total calculation with discount

refactor(auth): simplify JWT token refresh logic

docs(readme): add Docker setup instructions

test(utils): add tests for invoice calculation

chore(deps): upgrade React to 19.2.6
```

### Branch Naming

```
main              # Production-ready code
develop           # Integration branch for features
feature/room-images    # New feature
fix/invoice-calculation # Bug fix
refactor/context-api   # Code refactoring
release/1.0.0     # Release preparation
```

---

## Security Best Practices

### Input Sanitization

```javascript
// ✅ Always validate and sanitize user input
const sanitizedName = req.body.name.trim().slice(0, 255);

// ❌ Never trust user input directly
const name = req.body.name; // No validation!
```

### SQL Injection Prevention

```javascript
// ✅ Use parameterized queries
const query = 'SELECT * FROM rooms WHERE id = $1';
const { rows } = await pool.query(query, [roomId]);

// ❌ NEVER concatenate user input
const query = `SELECT * FROM rooms WHERE id = '${roomId}'`; // DANGEROUS!
```

### XSS Prevention

```javascript
// ✅ React auto-escapes by default
<div>{user.name}</div> // Safe

// ❌ Dangerous: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: user.bio }} /> // Only if sanitized!
```

### Authentication

```javascript
// ✅ Store JWT in httpOnly cookie (XSS protection)
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// ❌ Don't store sensitive data in localStorage
localStorage.setItem('password', password); // NEVER!
```

---

## Performance Guidelines

### React Performance

```javascript
// ✅ Memoize expensive calculations
const sortedRooms = useMemo(() => {
  return rooms.sort((a, b) => a.name.localeCompare(b.name));
}, [rooms]);

// ✅ Memoize callbacks
const handleClick = useCallback((id) => {
  updateRoom(id);
}, [updateRoom]);

// ✅ Split code with lazy loading
const Settings = React.lazy(() => import('./pages/Settings'));
```

### Database Performance

```sql
-- ✅ Create indexes on foreign keys and filter columns
CREATE INDEX idx_rooms_tenant ON rooms(tenant_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_invoices_status_date ON invoices(status, due_date);

-- ✅ Use LIMIT for pagination
SELECT * FROM rooms WHERE tenant_id = $1 LIMIT 50 OFFSET 0;
```

---

## Accessibility

```javascript
// ✅ Semantic HTML
<button onClick={handleSubmit}>Save</button>

// ❌ Non-semantic elements as buttons
<div onClick={handleSubmit}>Save</div>

// ✅ Proper labels
<label htmlFor="room-name">Room Name</label>
<input id="room-name" type="text" />

// ✅ ARIA attributes when needed
<button aria-label="Close modal" onClick={onClose}>×</button>
```

---

## Related Documents

- `docs/project-overview-pdr.md` - Product requirements
- `docs/system-architecture.md` - Technical architecture
- `docs/codebase-summary.md` - Code structure overview

---

**Document Owner:** Development Team  
**Last Reviewed:** June 16, 2026  
**Next Review:** After Phase 2 (API Development)
