# FABVERSE - Garment Production ERP

## Overview
Single-user ERP system for garment production tracking through stages: Cutting → Stitching → Bartack → Washing/Dyeing

## Problem Statement
Build a single-user garment production ERP app called "FABVERSE" that digitizes Excel and ERP notes for all production stages, generates challans for outsourced work, and enforces date validation.

## Architecture
- **Frontend**: React 19 with TailwindCSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with async MongoDB
- **Database**: MongoDB
- **Auth**: JWT-based single admin user (admin/admin)

## User Personas
- **Admin**: Single administrator managing entire production pipeline

## Core Requirements
1. ✅ Single admin login (admin/admin)
2. ✅ Cutting module with rolls table, fabric calculations
3. ✅ Stitching module with auto-increment challan (ST-XXX)
4. ✅ Bartack module
5. ✅ Washing/Dyeing module with auto-increment challan (W-XXX)
6. ✅ Dashboard with pipeline visualization
7. ✅ Color-coded status (Green=Completed, Yellow=In Progress)
8. ✅ Notes per stage (visible on challans)
9. ✅ Challan generation with print/PDF download
10. ✅ Bartack person name on washing challan
11. ✅ Excel import/export
12. ✅ Reports & Analytics
13. ✅ Change password functionality
14. ✅ Date validation (no past dates for future-oriented fields)

## UI/UX Overhaul (Dec 2025) - COMPLETED
Based on user reference images, the following UI changes were implemented:

### Theme & Colors
- **Background**: Light blue (#e8f4fc)
- **Sidebar**: Navy blue (#1e3a8a)
- **Primary**: Blue (#2563eb)
- **Active Nav**: Darker navy (#1e3a5f)

### Navigation Sidebar
- FABVERSE logo with $ icon
- Dashboard
- Lots
- Challans
- Reports
- Import/Export
- Change Password
- User avatar with admin name
- Logout button

### Dashboard Page
- Title: "Dashboard" with subtitle "Production pipeline overview"
- "+ New Lot" button (top right)
- 5 Stats Cards in a row:
  - Total Lots (package icon)
  - Cutting (scissors icon)
  - Stitching/Bartack (settings icon)
  - Washing (droplet icon)
  - Completed (check icon)
- Search bar with placeholder
- Stage filter dropdown
- Status filter dropdown
- **Table/Kanban view toggle**
- Data table with columns: Lot No, Date, Pcs, Fabric, Style, Fabricator, Stage, Status, Actions

### Kanban Drag-and-Drop Feature (NEW)
- 5 columns: Cutting, Stitching, Bartack, Washing/Dyeing, Completed
- Each column shows lot count
- Lot cards display: lot_no, style, pcs count, status badge
- Drag handles (GripVertical icons) on each card
- Drag lots between columns to change their production stage
- Status auto-updates: Cutting→Pending, Middle stages→In Progress, Completed→Completed
- Backend endpoint: PUT /api/lots/{lot_id}/stage
- Library: @dnd-kit for drag-and-drop functionality

### Lots Page
- Title: "Lots" with subtitle "Manage all production lots"
- "+ New Lot" button
- Search, Stage filter, Status filter
- Table with columns: Lot No, Date, Pcs, Sizes, Fabric, Style, Stage, Status, Actions (view + delete)
- Delete confirmation dialog

### Challans Page
- Title: "Challans" with subtitle "All generated challans"
- Type filter dropdown (All Types, Stitching, Washing)
- Table with columns: Challan No, Type (badge), Lot No, Issue Date, Recipient, Pcs, Actions

### Challan Detail View
- Back arrow with "Challan [number]"
- Subtitle showing challan type
- "Print Challan" button
- Card layout:
  - Header: $ logo, FABVERSE name, address, phone, challan no, date
  - Type badge (STITCHING CHALLAN / WASHING CHALLAN)
  - Recipient section (Fabricator / Washing/Dyeing Firm)
  - LOT DETAILS section (2-column grid)
  - Washing/Dyeing Instructions (for stitching challans)
  - Bartack Done By section (for washing challans - amber highlight)
  - Notes section
  - Signature lines

### Login Page
- Navy blue background with pattern
- White card with FABVERSE branding
- Username/Password fields
- Sign In button
- Default credentials hint

## What's Implemented (Dec 2025)
- ✅ Complete backend API with all CRUD operations
- ✅ UI/UX overhaul matching reference images
- ✅ Login page with navy blue theme
- ✅ Dashboard with stats cards and Table/Kanban toggle
- ✅ **Kanban drag-and-drop** to move lots between stages
- ✅ Separate Lots page with delete functionality
- ✅ Separate Challans page with type filter
- ✅ Redesigned Challan views (Stitching & Washing)
- ✅ Cutting form with rolls management
- ✅ Stitching form with auto-challan generation
- ✅ Bartack form
- ✅ Washing form with auto-challan generation
- ✅ Lot detail page with stage progression
- ✅ PDF download for challans
- ✅ Excel import/export functionality
- ✅ Reports page with charts and Excel export
- ✅ Change Password page
- ✅ **Gender field restricted to Mens/Womens/Kids**
- ✅ **Turnaround time metrics** (avg days between stages)
- ✅ **Delayed lots detection** (stuck in stage > 7 days)

## API Endpoints
- POST /api/auth/login
- POST /api/auth/change-password
- GET /api/lots, POST /api/lots, GET /api/lots/{id}, PUT /api/lots/{id}, DELETE /api/lots/{id}
- **PUT /api/lots/{lot_id}/stage** - Update lot stage (for Kanban drag-drop)
- POST /api/stitching, PUT /api/stitching/{lot_id}
- POST /api/bartack, PUT /api/bartack/{lot_id}
- POST /api/washing, PUT /api/washing/{lot_id}
- GET /api/challans, GET /api/challans/{id}
- POST /api/import/excel, GET /api/export/excel
- GET /api/reports/summary, GET /api/reports/export
- **GET /api/reports/turnaround** - Average turnaround times between stages
- **GET /api/reports/delayed?days_threshold=7** - Lots stuck in a stage
- GET /api/dashboard/stats
- GET/PUT /api/settings/firm

## Prioritized Backlog
### P0 (Critical) - DONE
- All core modules implemented and working
- UI/UX overhaul completed

### P1 (High) - COMPLETED
- ✅ Gender field restriction (Mens, Womens, Kids)
- ✅ Turnaround time analytics between stages
- ✅ Delayed lots detection and alerts

### P2 (Medium)
- Bulk operations on lots
- Mobile responsive improvements
- Kanban board drag-and-drop

### P3 (Low)
- Multiple user roles
- Email notifications
- Barcode/QR code generation for lots

## Next Tasks
1. Bulk operations on lots
2. Mobile responsive improvements

## Testing
- Backend tests: /app/backend/tests/
- Test reports: /app/test_reports/iteration_4.json
- All tests passing (100% success rate for both backend and frontend)
