// src/components/layout/AppLayout.jsx
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarCheck, DollarSign,
  UmbrellaOff, CalendarDays, Settings, LogOut, Building2
} from 'lucide-react'
import { useAuth } from '../../store/authStore'
import { toast } from '../ui'

const NAV = [
  {
    label: 'Overview', items: [
      { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Workforce', items: [
      { to: '/employees',  icon: Users,          label: 'Employees' },
      { to: '/attendance', icon: CalendarCheck,  label: 'Attendance' },
      { to: '/leaves',     icon: UmbrellaOff,    label: 'Leave Requests' },
      { to: '/holidays',   icon: CalendarDays,   label: 'Holidays' },
    ]
  },
  {
    label: 'Finance', items: [
      { to: '/salary', icon: DollarSign, label: 'Payroll' },
    ]
  },
  {
    label: 'System', items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-mark">W</div>
            <div>
              <div className="brand-name">WorkForce</div>
              <div className="brand-tagline">HR & ATTENDANCE</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(section => (
            <div className="nav-section" key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <item.icon size={15} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div className="user-name truncate">{user?.name}</div>
              <div className="user-org truncate">{user?.organization}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', marginTop: 4 }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
