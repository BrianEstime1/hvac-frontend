# HVAC Management System

## Overview

This is a professional HVAC management system built as a React single-page application that connects to an external REST API. The application enables HVAC businesses to manage customers, schedule appointments, and track inventory through an intuitive dashboard interface. The frontend is built with React, TypeScript, and Vite, utilizing shadcn/ui components for a polished Material Design-inspired interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool**: React 18 with TypeScript, bundled using Vite for fast development and optimized production builds.

**Routing**: Wouter is used for client-side routing, providing a lightweight alternative to React Router. Routes include login, dashboard, customers, appointments, and inventory pages.

**State Management**: TanStack Query (React Query) handles all server state management, providing caching, background refetching, and optimistic updates. No global client state management library is used - component state suffices for UI interactions.

**UI Component System**: shadcn/ui components built on Radix UI primitives provide accessible, customizable components. The design follows a Material Design-inspired approach with emphasis on data hierarchy and professional appearance.

**Styling**: Tailwind CSS with custom CSS variables for theming. The design system uses a neutral base color with spacing primitives (2, 4, 6, 8 units), Inter font family, and consistent border radius values.

**Form Management**: React Hook Form with Zod validation schemas ensure type-safe form handling and validation across customer, appointment, and inventory forms.

### Backend Architecture

**Server Framework**: Express.js serves as the HTTP server, but the application architecture is primarily frontend-focused. The Express server mainly handles static file serving in production and Vite middleware in development.

**API Strategy**: The application does NOT implement its own backend API. Instead, it connects directly to an external API hosted at `https://hvac-management-api.onrender.com`. All data operations (CRUD for customers, appointments, inventory) are performed via HTTP requests to this external service.

**Development vs Production**:
- Development mode (`server/index-dev.ts`): Vite dev server with HMR
- Production mode (`server/index-prod.ts`): Serves pre-built static files from `dist/public`

### Data Layer

**Schema Validation**: Zod schemas in `shared/schema.ts` define the shape of data entities (Customer, Appointment, InventoryItem) and provide runtime validation. These schemas are shared between validation logic and TypeScript type inference.

**Data Models**:
- **Customer**: Basic contact information (name, email, phone, address)
- **Appointment**: Scheduled services linked to customers with date, time, description, and status
- **InventoryItem**: Parts and supplies with quantity tracking and categorization
- **DashboardStats**: Aggregated metrics for overview display

**Database**: The application references PostgreSQL and Drizzle ORM in configuration files (`drizzle.config.ts`), but these are not actively used since the app connects to an external API. The database schema and ORM setup exist but may be vestigial or intended for future local development.

### External Dependencies

**External API**: `https://hvac-management-api.onrender.com` - Primary data source for all CRUD operations. The frontend makes HTTP requests via axios for customers, appointments, inventory, and dashboard statistics.

**UI Component Library**: 
- Radix UI - Unstyled, accessible component primitives
- shadcn/ui - Pre-styled components following "new-york" style variant
- Lucide React - Icon library

**HTTP Client**: Axios configured with the external API base URL, providing request/response interceptors and error handling.

**Styling & Utilities**:
- Tailwind CSS - Utility-first CSS framework
- class-variance-authority - Component variant management
- clsx & tailwind-merge - Conditional className utilities

**Form & Validation**:
- React Hook Form - Form state management
- Zod - Schema validation
- @hookform/resolvers - Zod integration with React Hook Form

**Development Tools**:
- TypeScript - Type safety
- Vite - Build tool and dev server
- ESBuild - Production bundling for server code
- Replit plugins - Development environment integration

### Design System

The application follows documented design guidelines in `design_guidelines.md`:

- **Typography**: Inter font with hierarchical sizing (2xl for page titles, xl for sections, lg for cards)
- **Layout**: Fixed sidebar (16rem width) with responsive collapse on mobile (<768px)
- **Color System**: CSS custom properties for theme colors with light/dark mode support
- **Components**: Material Design-inspired cards, tables, forms, and modals with consistent spacing and elevation
- **Status Indicators**: Color-coded badges for inventory levels (red for low stock <10, secondary for medium <20, default for in stock)

### Authentication & Authorization

The application includes a login page but does not implement real authentication. The login flow is a placeholder that redirects users to the dashboard without credential validation. No session management, JWT tokens, or protected routes are implemented.