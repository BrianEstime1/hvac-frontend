# HVAC Management System - Frontend

A modern, responsive web application for HVAC businesses to manage customers, appointments, invoices, and inventory. Built for **FERDAIR LLC** with React, TypeScript, and TailwindCSS.



## 🚀 Live Demo

**Frontend:** [https://hvac-frontend-eight.vercel.app](https://hvac-frontend-eight.vercel.app)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Deployment](#deployment)
- [Future Enhancements](#future-enhancements)

---

## ✨ Features

- **Dashboard** - Real-time business metrics and low stock alerts
- **Customer Management** - Full CRUD operations with search
- **Appointment Scheduling** - Service appointments with customer tracking
- **Invoice Generation** - PDF invoices with payment tracking
- **Inventory Management** - Stock tracking with automated alerts

---

## 🛠 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Shadcn/ui** - Component library
- **TailwindCSS** - Styling
- **Lucide React** - Icons

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/BrianEstime1/hvac-frontend.git
cd hvac-frontend

# Install dependencies
cd client
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=https://hvac-management-api.onrender.com
```

---

## 📁 Project Structure

```
client/
├── src/
│   ├── components/
│   │   └── ui/              # Shadcn/ui components
│   ├── pages/
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Customers.tsx    # Customer management
│   │   ├── Appointments.tsx # Appointment scheduling
│   │   ├── Invoices.tsx     # Invoice generation
│   │   └── Inventory.tsx    # Inventory tracking
│   ├── lib/
│   │   ├── queryClient.ts   # React Query setup
│   │   └── apiTransformers.ts # API data transformers
│   ├── hooks/
│   │   └── use-toast.ts     # Toast notifications
│   ├── shared/
│   │   └── schema.ts        # Zod validation schemas
│   ├── App.tsx              # Root component with routing
│   └── main.tsx             # Entry point
├── vercel.json              # Vercel deployment config
└── package.json
```

---

## 🎯 Key Features

### API Integration
- Centralized API client with automatic data transformation
- Converts between frontend camelCase and backend snake_case
- Error handling with user-friendly toast notifications

### Form Management
- Type-safe forms with React Hook Form + Zod
- Real-time validation
- Optimistic UI updates

### State Management
- TanStack Query for server state
- Automatic caching and background refetching
- Loading and error states handled automatically

### UI/UX
- Fully responsive design (mobile, tablet, desktop)
- Accessible components from Shadcn/ui
- Loading skeletons for better perceived performance
- Status badges and visual feedback

---

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import repository in Vercel
3. Configure build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable: `VITE_API_URL`
5. Deploy!

Vercel will automatically deploy on every push to main.

---

## 🔮 Future Enhancements

- User authentication and authorization
- Email invoice functionality
- Mobile app version
- Customer portal
- Automated appointment reminders
- Advanced reporting and analytics

---

## 👨‍💻 Developer

Built by **Brian Estime**
- Computer Science Student at Hillsborough Community College
- Basketball Player & Technical Assistant at FERDAIR LLC
- [GitHub](https://github.com/BrianEstime1)

---

## 📄 License

This project was built for FERDAIR LLC. All rights reserved.

---

## 🙏 Acknowledgments

- Shadcn/ui for the amazing component library
- TanStack Query for simplified server state management
- Vercel for seamless deployment
