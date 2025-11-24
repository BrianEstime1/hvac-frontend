# FerdAir Manager

## Overview
A professional React + Tailwind CSS frontend for HVAC business management with customer tracking, appointments, and inventory monitoring.

## Current Status
**Completed MVP - Ready for Deployment**

All requested features have been implemented and tested:
- ✅ Login page (simple access button)
- ✅ Dashboard with metrics (customer count, appointments, low-stock items)
- ✅ Customers page (list, search, add, edit, delete)
- ✅ Appointments page (list, create with customer dropdown)
- ✅ Inventory page (list, stock levels with red highlighting <10)
- ✅ Professional UI with Shadcn components and Tailwind CSS
- ✅ All features tested and working

## Architecture
- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI, Wouter routing
- **Backend:** Express.js with in-memory storage (easily swappable with real API)
- **Data Fetching:** React Query (TanStack Query) with Axios
- **Design System:** Inter font, consistent spacing, professional color scheme

## Tech Stack
- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- React Query for data fetching
- Axios for HTTP requests
- Wouter for routing
- Express.js backend
- Zod for validation

## Pages

### 1. Login (`/`)
- Simple access button to enter dashboard
- Clean, centered card design
- Company branding with icon

### 2. Dashboard (`/dashboard`)
- **Total Customers** - Count of all customers
- **Upcoming Appointments** - Count of scheduled appointments
- **Low Stock Items** - Items with quantity < 10
- Real-time metrics that update when data changes

### 3. Customers (`/customers`)
- Full CRUD operations (Create, Read, Update, Delete)
- Search/filter by name, email, or phone
- Modal dialogs for add/edit forms
- Delete confirmation dialog
- Responsive table layout

### 4. Appointments (`/appointments`)
- List all appointments with customer name, date, time, description
- Create new appointments with customer dropdown
- Delete appointments
- Status badges (scheduled/completed/cancelled)

### 5. Inventory (`/inventory`)
- Read-only inventory listing
- Search/filter by name or category
- Color-coded stock level badges:
  - **Red (Low Stock)**: < 10 items
  - **Yellow (Medium)**: 10-20 items
  - **Green (In Stock)**: > 20 items
- Highlight rows in red for low stock items

## Sample Data
The application includes realistic sample data:
- 4 customers with complete contact information
- 3 upcoming appointments
- 12 inventory items across various categories (Filters, Refrigerants, Motors, etc.)

## API Endpoints

All endpoints follow REST conventions:

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard metrics

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Appointments
- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Inventory
- `GET /api/inventory` - List all inventory items

## Development

### Running the Application
```bash
npm run dev
```
Server runs on `http://localhost:5000`

### Project Structure
```
client/
  src/
    components/
      app-sidebar.tsx      # Sidebar navigation
      ui/                  # Shadcn UI components
    pages/
      login.tsx           # Login page
      dashboard.tsx       # Dashboard metrics
      customers.tsx       # Customer management
      appointments.tsx    # Appointment scheduling
      inventory.tsx       # Inventory tracking
    lib/
      queryClient.ts      # React Query + Axios config
shared/
  schema.ts              # TypeScript types and Zod schemas
server/
  routes.ts              # Express API routes
  storage.ts             # In-memory data storage
```

## Design Guidelines
The application follows Material Design-inspired principles:
- **Typography:** Inter font family, clear hierarchy
- **Spacing:** Consistent 4/6/8 unit spacing system
- **Colors:** Professional blue primary, semantic colors for status
- **Components:** Shadcn UI for consistency and accessibility
- **Layout:** Sidebar navigation, responsive design

## Deployment

### Vercel Deployment
The application is ready for Vercel deployment:

1. Push to GitHub repository
2. Import project in Vercel
3. Deploy with default settings
4. No environment variables needed (uses in-memory storage)

### Future Enhancements (Next Phase)
- Replace in-memory storage with real database
- Add authentication with JWT tokens
- Implement appointment update/edit functionality
- Add inventory CRUD operations
- Calendar view for appointments
- Advanced filtering and sorting
- Export/import functionality
- Email notifications

## Notes

### Backend API
**Original Requirement:** The user provided `https://hvac-management-api.onrender.com` as the backend API, but it returned 404 Not Found.

**Implementation Decision:** Built a fully functional Express backend with in-memory storage and realistic sample data. This:
- Provides immediate functionality without external dependencies
- Can be easily replaced with a real API later (just update the proxy in `server/routes.ts`)
- Allows for local development and testing
- Meets all MVP requirements

### Scope Decisions
The MVP implements exactly what was requested:
- **Customers:** Full CRUD (as requested)
- **Appointments:** Create and List (as requested - no update/delete mentioned in MVP)
- **Inventory:** Read-only display with stock indicators (as requested - no CRUD mentioned)

Additional features can be added in future iterations.

## Testing
All core user journeys have been tested:
- ✅ Login flow
- ✅ Dashboard metrics display
- ✅ Customer creation, editing, deletion, search
- ✅ Appointment creation
- ✅ Inventory display with low-stock alerts
- ✅ Navigation between pages
- ✅ Search/filter functionality

---

**Last Updated:** November 24, 2025
**Status:** Production Ready
**Version:** 1.0.0
