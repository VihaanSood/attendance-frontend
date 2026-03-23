// src/pages/DashboardPage.jsx
import { useState } from 'react'
import { Users, UserCheck, UserX, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useApi } from '../hooks/useApi'
import { dashboard } from '../services/api'
import { StatCard, Card, Badge, Spinner, Empty } from '../components/ui'
import { useAuth } from '../store/authStore'
import { format } from 'date-fns'

const now = new Date()
const MONTH = now.getMonth() + 1
const YEAR = now.getFullYear()

const PIE_COLORS = { PRESENT: '#00d4aa', ABSENT: '#ff4757', LEAVE: '#ffb830', HALF_DAY: '#4a9eff', HOLIDAY: '#9b59ff' }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-base)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: overview, loading } = useApi(() => dashboard.overview())
  const { data: trend } = useApi(() => dashboard.trend({ month: MONTH, year: YEAR }))

  const today = overview?.data?.today || {}
  const month = overview?.data?.thisMonth || {}
  const emp = overview?.data?.employees || {}

  const todayPie = Object.entries({ PRESENT: today.PRESENT || 0, ABSENT: today.ABSENT || 0, LEAVE: today.LEAVE || 0 })
    .map(([name, value]) => ({ name, value })).filter(d => d.value > 0)

  const trendData = trend?.data || []

  return (
    <div className="animate-up">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-heading">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</div>
          <div className="page-desc">{format(now, 'EEEE, MMMM d yyyy')} · {user?.organization}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4 section">
        <StatCard label="Total Employees" value={emp.total} icon={Users} color="accent" loading={loading} />
        <StatCard label="Present Today" value={today.PRESENT} icon={UserCheck} color="green" loading={loading} />
        <StatCard label="Absent Today" value={today.ABSENT} icon={UserX} color="red" loading={loading} />
        <StatCard label="On Leave" value={today.LEAVE} icon={Clock} color="amber" loading={loading} />
      </div>

      {/* Charts row */}
      <div className="grid-2 section">
        {/* Monthly trend */}
        <Card>
          <div className="section-title">Monthly Attendance Trend</div>
          {trendData?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d4aa" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff4757" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                  tickFormatter={d => d.slice(8)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="PRESENT" name="Present" stroke="#00d4aa" fill="url(#gPresent)" strokeWidth={2} />
                <Area type="monotone" dataKey="ABSENT"  name="Absent"  stroke="#ff4757" fill="url(#gAbsent)"  strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? <Spinner /> : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</span>}
            </div>
          )}
        </Card>

        {/* Today's breakdown */}
        <Card>
          <div className="section-title">Today's Attendance</div>
          {loading ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div> : (
            <div style={{ display: 'flex', alignItems: 'center', height: 200 }}>
              {todayPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie data={todayPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {todayPie.map((entry) => (
                          <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#4a5568'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {todayPie.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[d.name], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{d.value}</span>
                      </div>
                    ))}
                    {today.notMarked > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--border-bright)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Not Marked</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{today.notMarked}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Empty icon={AlertTriangle} title="No attendance marked today" desc="Use the Attendance page to mark attendance" />
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Monthly totals + pending leaves */}
      <div className="grid-2 section">
        <Card>
          <div className="section-title">This Month Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Total Present', value: month.PRESENT || 0, color: 'var(--green)' },
              { label: 'Total Absent',  value: month.ABSENT  || 0, color: 'var(--red)' },
              { label: 'On Leave',      value: month.LEAVE   || 0, color: 'var(--amber)' },
              { label: 'Half Days',     value: month.HALF_DAY|| 0, color: 'var(--blue)' },
              { label: 'Holidays',      value: month.HOLIDAY || 0, color: 'var(--purple)' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: row.color, fontSize: 15 }}>{row.value}</span>
              </div>
            ))}
          </div>
          {overview?.data?.payrollEstimate && (
            <div style={{ marginTop: 16, padding: '12px', background: 'var(--accent-dim)', borderRadius: 'var(--r-md)', border: '1px solid var(--accent-glow)' }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Estimated Payroll</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {overview.data.payrollEstimate.currency} {overview.data.payrollEstimate.totalPayroll?.toLocaleString()}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="section-title">Pending Leave Requests</div>
          {loading ? <Spinner /> : overview?.data?.pendingLeaves?.length === 0 ? (
            <Empty icon={Clock} title="All clear!" desc="No pending leave requests" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {overview?.data?.pendingLeaves?.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--amber)', flexShrink: 0 }}>
                    {l.employee?.name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{l.employee?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {format(new Date(l.startDate), 'MMM d')} – {format(new Date(l.endDate), 'MMM d')}
                    </div>
                  </div>
                  <Badge label={l.type} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Departments */}
      {emp.departments?.length > 0 && (        <Card className="section">
          <div className="section-title">Department Distribution</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={emp.departments} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Employees" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
