# FABVERSE - Garment Production ERP

## Overview
Single-user ERP system for garment production tracking through stages: Cutting → Stitching → Bartack → Washing/Dyeing

## Problem Statement
Build a single-user garment production ERP app called "FABVERSE" that digitizes Excel and ERP notes for all production stages, generates challans for outsourced work, and enforces date validation.

## Architecture
- **Frontend**: React 19 with TailwindCSS, Radix UI components
- **Backend**: FastAPI (Python) with async MongoDB
- **Database**: MongoDB
- **Auth**: JWT-based single admin user (admin/admin)

## User Personas
- **Admin**: Single administrator managing entire production pipeline

## Core Requirements
1. ✅ Single admin login (admin/admin)
2. ✅ Dark/Light theme toggle
3. ✅ Cutting module with rolls table, fabric calculations
4. ✅ Stitching module with auto-increment challan (ST-XXX)
5. ✅ Bartack module
6. ✅ Washing/Dyeing module with auto-increment challan (W-XXX)
7. ✅ Dashboard with pipeline visualization
8. ✅ Color-coded status (Green=Completed, Yellow=In Progress)
9. ✅ Notes per stage (visible on challans)
10. ✅ Challan generation with print view
11. ✅ Bartack person name on washing challan
12. ✅ Excel import/export
13. ✅ Reports & Analytics
14. ✅ Change password functionality
15. ✅ Date validation (no past dates for future-oriented fields)

## What's Implemented (Feb 15, 2026)
- Complete backend API with all CRUD operations
- Login page with industrial factory background and custom logo
- Dashboard with stats cards and production table
- Cutting form with rolls management and cost calculations
- Stitching form with auto-challan generation
- Bartack form
- Washing form with auto-challan generation
- Lot detail page with stage progression
- **Challan print view with dynamic firm details from settings**
- Excel import/export functionality
- Reports page with charts (Recharts)
- **Settings page with tabs:**
  - **Firm Details**: Logo URL, firm name, GST, address, mobile, email with live preview
  - **Account**: Password change
  - **About**: App info
- Dark/Light theme support
- Responsive design for desktop and tablet

## API Endpoints
- POST /api/auth/login
- POST /api/auth/change-password
- GET /api/lots, POST /api/lots, GET /api/lots/{id}, PUT /api/lots/{id}, DELETE /api/lots/{id}
- POST /api/stitching, PUT /api/stitching/{lot_id}
- POST /api/bartack, PUT /api/bartack/{lot_id}
- POST /api/washing, PUT /api/washing/{lot_id}
- GET /api/challans, GET /api/challans/{id}
- POST /api/import/excel, GET /api/export/excel
- GET /api/reports/summary
- GET /api/dashboard/stats

## Prioritized Backlog
### P0 (Critical) - DONE
- All core modules implemented and working

### P1 (High)
- Turnaround time analytics between stages
- Delayed lots detection and alerts

### P2 (Medium)
- Bulk operations on lots
- Custom challan firm details from settings
- PDF download instead of print
- Mobile responsive improvements

### P3 (Low)
- Multiple user roles
- Email notifications
- Barcode/QR code generation for lots

## Next Tasks
1. Add firm customization in settings for challan
2. Implement delayed lot detection
3. Add turnaround time metrics in reports
