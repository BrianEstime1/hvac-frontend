# HVAC Management System Design Guidelines

## Design Approach
**System Selected:** Material Design-inspired dashboard system
**Rationale:** Business management tool requiring clear data hierarchy, efficient workflows, and professional appearance. Emphasizes functionality, scanability, and task completion.

## Typography System
- **Primary Font:** Inter (Google Fonts)
- **Headings:** font-bold with sizes: text-2xl (page titles), text-xl (section headers), text-lg (card headers)
- **Body:** font-normal text-base for content, text-sm for metadata/labels
- **Monospace:** font-mono text-sm for IDs, codes, stock numbers

## Layout & Spacing System
**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, py-8)
- **Page containers:** max-w-7xl mx-auto px-6 py-8
- **Cards/panels:** p-6 with rounded-lg and shadow
- **Form fields:** mb-4 standard spacing
- **Section gaps:** space-y-6 for vertical stacking

**Layout Structure:**
- Sidebar navigation (fixed left, w-64)
- Main content area (ml-64, full remaining width)
- Responsive: Sidebar collapses to mobile menu on <768px

## Component Library

### Navigation
- **Sidebar:** Fixed left panel with logo top, navigation links with icons, active state with subtle background
- **Top bar:** Page title left, user profile/actions right

### Dashboard Cards
- **Metric cards:** Grid layout (grid-cols-1 md:grid-cols-3 gap-6)
- Each card: Large number (text-3xl font-bold), label below (text-sm), icon top-right corner
- Low-stock card: Show red badge/indicator for items <10

### Data Tables
- **Structure:** Full-width with alternating row backgrounds for scanability
- **Header row:** Sticky with font-semibold text-sm uppercase tracking-wide
- **Cells:** py-4 px-6 with clear borders
- **Actions:** Icon buttons right-aligned (edit, delete) with hover states
- **Search bar:** Above table with icon, placeholder text, mb-4

### Forms & Modals
- **Modal overlay:** Fixed with backdrop blur and centered card
- **Form layout:** Single column, labels above inputs, helper text below
- **Input fields:** border rounded px-4 py-2 with focus ring
- **Buttons:** Primary (solid), Secondary (outline), Danger (for delete)
- **Dropdowns:** Custom select with chevron icon, max-height with scroll

### Status Indicators
- **Stock levels:** Badge component - green (>20), yellow (10-20), red (<10)
- **Appointment status:** Colored dots or pills next to appointment entries

### Buttons
- **Primary:** px-6 py-2.5 rounded font-medium with solid fill
- **Secondary:** Border with transparent background
- **Icon buttons:** p-2 rounded-full with hover background
- All buttons: Smooth transition on hover/active states

## Page-Specific Layouts

### Login Page
- Centered card (max-w-md) with logo, title, single button
- Minimal with ample whitespace

### Dashboard
- 3-column metric cards at top
- Below: Two sections side-by-side (Upcoming Appointments + Low Stock)
- Each section: Card with header and scrollable list

### Customers/Appointments/Inventory Pages
- Search/filter bar at top with "Add New" button right-aligned
- Data table below filling remaining space
- Pagination footer if needed

## Interaction Patterns
- **Add/Edit:** Modal overlay with form
- **Delete:** Confirmation modal before action
- **Search:** Live filter as user types
- **Loading states:** Subtle spinner or skeleton screens
- **Empty states:** Centered message with icon and "Add First Item" CTA

## Responsive Behavior
- **Desktop (>1024px):** Full sidebar, multi-column grids
- **Tablet (768-1024px):** Condensed sidebar or hamburger menu, 2-column grids
- **Mobile (<768px):** Hamburger menu, single-column layouts, stacked cards

## Accessibility
- Consistent tab order through forms and tables
- ARIA labels on icon-only buttons
- Focus indicators on all interactive elements
- Sufficient contrast ratios throughout

## Images
**No hero images needed** - this is a functional dashboard application. Only use:
- Logo/brand mark in sidebar header
- Icon set (Heroicons) for navigation, actions, and status indicators
- Avatar placeholder for user profile

---

**Design Philosophy:** Prioritize clarity, efficiency, and data density. Every pixel should serve a functional purpose. Clean hierarchy guides users through tasks quickly. Professional but not sterile—subtle shadows and spacing create visual comfort without distraction.