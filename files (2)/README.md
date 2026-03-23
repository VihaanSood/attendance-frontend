# WorkForce — Frontend

A sophisticated React SPA for the Attendance & Employee Management System.

## 🎨 Design System

- **Aesthetic**: Dark industrial / brutalist precision
- **Fonts**: Syne (display) + JetBrains Mono (data)
- **Color**: Deep navy/void dark theme with electric teal accent (`#00d4aa`)
- **Components**: Full custom UI library (no third-party component libs)

## 📁 Project Structure

```
attendance-frontend/
│
├── index.html                    # Entry HTML with Google Fonts
├── vite.config.js                # Vite + proxy to backend :5000
├── package.json
│
└── src/
    ├── main.jsx                  # ReactDOM root mount
    ├── App.jsx                   # Router setup + auth guards
    │
    ├── styles/
    │   ├── global.css            # Design tokens, animations, base
    │   ├── components.css        # Button, Input, Card, Badge, Modal, Toast etc.
    │   └── layout.css            # Sidebar, topbar, page shell, auth pages
    │
    ├── services/
    │   └── api.js                # All API calls — maps to every backend endpoint
    │                             # Auto token refresh on 401 + file download helper
    │
    ├── store/
    │   └── authStore.jsx         # AuthContext — login, register, logout, user state
    │
    ├── hooks/
    │   └── useApi.js             # useApi (single fetch) + usePaginated hook
    │
    ├── components/
    │   ├── ui/
    │   │   └── index.jsx         # Button, Input, Select, Card, Badge, Modal,
    │   │                         # Toaster/toast, Spinner, Empty, StatCard,
    │   │                         # Table, Pagination
    │   └── layout/
    │       └── AppLayout.jsx     # Sidebar + nav + user footer + Outlet
    │
    ├── pages/
    │   ├── LoginPage.jsx         # Auth — JWT login form
    │   ├── RegisterPage.jsx      # Auth — create org account
    │   ├── DashboardPage.jsx     # Overview stats, area chart, pie chart, trend
    │   ├── EmployeesPage.jsx     # CRUD table + create/edit modal
    │   ├── AttendancePage.jsx    # 3 views: Daily mark | Employee history + calendar | Summary
    │   ├── SalaryPage.jsx        # Payroll table + per-employee breakdown modal + export
    │   ├── LeavesPage.jsx        # Submit, approve, reject leave requests
    │   ├── HolidaysPage.jsx      # Holiday calendar with mark-attendance action
    │   └── SettingsPage.jsx      # Payroll config + password change + system info
    │
    └── utils/
        └── helpers.js            # Currency/date formatters, initials, month/year options
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Backend running at `http://localhost:5000`

### Install & Run
```bash
cd attendance-frontend
npm install
npm run dev
# → http://localhost:3000
```

The Vite dev server proxies `/api` requests to `http://localhost:5000` automatically.

### Build for Production
```bash
npm run build
# Output in dist/ — serve with any static host or nginx
```

---

## 🖥️ Pages & Features

### 🔐 Auth (Login / Register)
- JWT-based login with auto token storage
- Auto-refresh token on 401 responses
- Register creates a full organization account
- Protected routes redirect to `/login` if unauthenticated

### 📊 Dashboard
- Live stats: total employees, present today, absent, on leave
- Area chart — monthly attendance trend (Recharts)
- Pie chart — today's attendance breakdown
- Monthly totals and payroll estimate
- Pending leave requests list
- Department bar chart

### 👥 Employees
- Full paginated table with search (name/role/dept)
- Create / Edit modal with all fields
- Soft-delete (deactivate) with confirmation
- Department filter

### 📅 Attendance
Three view modes switchable via top toggle:

1. **Daily View** — Mark each employee individually with one-click status buttons OR save all at once with bulk-save
2. **Employee View** — Calendar heatmap visualization per employee with month navigation + CSV export
3. **Summary View** — Monthly table showing P/A/L/half-day totals per employee

### 💰 Payroll
- Full payroll report table per month
- Click any row for detailed salary breakdown modal
- Shows formula: `salary_per_day = monthly_salary / working_days`
- Export to CSV or PDF
- Running total footer

### 🏖️ Leaves
- Submit leave requests (date range + type + reason)
- Filter by status (Pending / Approved / Rejected) and type
- One-click Approve / Reject with confirmation
- Approved leaves auto-mark attendance as LEAVE
- Day count preview in create modal

### 🗓️ Holidays
- Year-based calendar list (past / upcoming split)
- Add holidays with date + description
- "Mark Attendance" button — bulk-marks all employees as HOLIDAY
- Year switcher (+/- 1 year)

### ⚙️ Settings
- Payroll config: working days per month, currency, timezone
- Live formula preview that updates as you type
- Password change with validation
- Read-only org info panel
- System information panel

---

## 🔌 API Integration

All API calls go through `src/services/api.js`. It handles:
- Bearer token attachment on every request
- Automatic token refresh when access token expires
- File downloads (CSV/PDF) via blob URL trick
- Consistent error shape thrown to UI

---

## 🎨 Component Library

All components live in `src/components/ui/index.jsx`:

| Component | Usage |
|---|---|
| `Button` | `variant`: primary/secondary/ghost/danger/success · `size`: sm/md/lg · `loading` spinner |
| `Input` | Label, icon, error, hint |
| `Select` | Options array `[{value, label}]` |
| `Card` | Surface with shadow; `glass` variant |
| `Badge` | Auto-colors by label (PRESENT→green, ABSENT→red, etc.) |
| `Modal` | Accessible (Escape closes), sizes sm/md/lg/xl |
| `toast` | `toast.success/error/info/warn(msg)` — auto-dismiss 4s |
| `Toaster` | Mount once in App.jsx |
| `Table` | Columns with `render` fn, loading skeletons, empty state |
| `Pagination` | Previous/next with page count |
| `StatCard` | Metric card with icon, value, optional delta % |
| `Empty` | Icon + title + description + optional action button |
| `Spinner` | Animated Lucide Loader2 |
