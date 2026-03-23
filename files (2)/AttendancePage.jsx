// src/pages/AttendancePage.jsx
import { useState, useEffect } from 'react'
import { CalendarCheck, ChevronLeft, ChevronRight, Download, CheckSquare } from 'lucide-react'
import { attendance as attApi, employees as empApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Button, Badge, Card, Table, Modal, Select, toast, Spinner, Empty, Pagination } from '../components/ui'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns'

const STATUS_OPTIONS = [
  { value: 'PRESENT',  label: 'Present' },
  { value: 'ABSENT',   label: 'Absent' },
  { value: 'LEAVE',    label: 'Leave' },
  { value: 'HALF_DAY', label: 'Half Day' },
  { value: 'HOLIDAY',  label: 'Holiday' },
]

const STATUS_COLORS = {
  PRESENT: '#00d4aa', ABSENT: '#ff4757', LEAVE: '#ffb830',
  HALF_DAY: '#4a9eff', HOLIDAY: '#9b59ff', NOT_MARKED: '#2d3748',
}

export default function AttendancePage() {
  const [view, setView] = useState('daily')  // 'daily' | 'employee' | 'summary'
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedEmp, setSelectedEmp] = useState('')
  const [page, setPage] = useState(1)
  const [bulkMap, setBulkMap] = useState({})
  const [saving, setSaving] = useState(false)
  const [empPage, setEmpPage] = useState(1)

  // Employees list for dropdowns
  const { data: empData } = useApi(() => empApi.list({ limit: 200, isActive: true }), [])
  const empList = empData?.data || []

  // Daily attendance
  const { data: dailyData, loading: dailyLoading, execute: refreshDaily } = useApi(
    () => view === 'daily' ? attApi.daily(date, { page, limit: 20 }) : Promise.resolve(null),
    [view, date, page]
  )

  // Employee history
  const { data: empHistory, loading: empLoading } = useApi(
    () => view === 'employee' && selectedEmp
      ? attApi.employee(selectedEmp, { month, year, page: empPage, limit: 15 })
      : Promise.resolve(null),
    [view, selectedEmp, month, year, empPage]
  )

  // Monthly summary
  const { data: summaryData, loading: summaryLoading } = useApi(
    () => view === 'summary' ? attApi.summary({ month, year }) : Promise.resolve(null),
    [view, month, year]
  )

  // Initialise bulk status map from daily data
  useEffect(() => {
    if (dailyData?.data?.records) {
      const map = {}
      dailyData.data.records.forEach(r => {
        map[r.employeeId] = r.attendance?.status || ''
      })
      setBulkMap(map)
    }
  }, [dailyData])

  const handleBulkSave = async () => {
    const records = Object.entries(bulkMap)
      .filter(([, s]) => s)
      .map(([employeeId, status]) => ({ employeeId, status }))

    if (!records.length) { toast.warn('No statuses selected'); return }
    setSaving(true)
    try {
      const res = await attApi.bulkMark({ date, records })
      toast.success(`Attendance saved for ${res.data.marked} employees`)
      refreshDaily()
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const handleSingleMark = async (employeeId, status) => {
    try {
      await attApi.mark({ employeeId, date, status })
      toast.success('Attendance updated')
      refreshDaily()
    } catch (err) { toast.error(err.message) }
  }

  const navMonth = (dir) => {
    let m = month + dir, y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setMonth(m); setYear(y)
  }

  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy')

  const summaryList = summaryData?.data || []

  // ── Calendar mini-view for employee history ────────────────────
  const calendarDays = view === 'employee' && empHistory?.data ? (() => {
    const start = startOfMonth(new Date(year, month - 1, 1))
    const end = endOfMonth(start)
    const days = eachDayOfInterval({ start, end })
    const recordMap = {}
    empHistory.data.records?.forEach(r => {
      recordMap[r.date?.slice(0, 10)] = r.status
    })
    return { days, recordMap, startDay: getDay(start) }
  })() : null

  return (
    <div className="animate-up">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-heading">Attendance</div>
          <div className="page-desc">Track and manage daily attendance</div>
        </div>
        <div className="page-header-right">
          {/* View switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-md)', padding: 3, gap: 2 }}>
            {[['daily','Daily View'],['employee','By Employee'],['summary','Summary']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600,
                background: view === v ? 'var(--accent)' : 'transparent',
                color: view === v ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── DAILY VIEW ──────────────────────────────────────────── */}
      {view === 'daily' && (
        <>
          <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)}
                style={{ width: 160, height: 34, fontSize: 12 }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {dailyData?.data?.pagination?.total ?? 0} employees
              </span>
            </div>
            <Button icon={CheckSquare} loading={saving} onClick={handleBulkSave} size="sm">Save All</Button>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {dailyLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}><Spinner /></div>
            ) : dailyData?.data?.records?.length === 0 ? (
              <Empty icon={CalendarCheck} title="No employees found" desc="Add employees first" />
            ) : (
              <table className="table" style={{ borderRadius: 0 }}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Current Status</th>
                    <th>Mark As</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData?.data?.records?.map(r => (
                    <tr key={r.employeeId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                            {r.name?.[0]}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.role}</td>
                      <td><Badge label={r.status || 'NOT_MARKED'} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {STATUS_OPTIONS.map(s => (
                            <button key={s.value} onClick={() => handleSingleMark(r.employeeId, s.value)}
                              style={{
                                padding: '3px 8px', border: '1px solid', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                                background: r.status === s.value ? STATUS_COLORS[s.value] : 'transparent',
                                color: r.status === s.value ? '#000' : STATUS_COLORS[s.value],
                                borderColor: STATUS_COLORS[s.value] + '60',
                                transition: 'all 0.15s',
                              }}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Pagination pagination={dailyData?.data?.pagination} page={page} setPage={setPage} />
        </>
      )}

      {/* ── EMPLOYEE HISTORY VIEW ──────────────────────────────── */}
      {view === 'employee' && (
        <>
          <div className="filter-bar">
            <select className="field-input field-select" value={selectedEmp}
              onChange={e => setSelectedEmp(e.target.value)} style={{ width: 220, height: 34, fontSize: 12 }}>
              <option value="">Select employee…</option>
              {empList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => navMonth(-1)}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', minWidth: 120, textAlign: 'center' }}>{monthLabel}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navMonth(1)}><ChevronRight size={14} /></button>
            {selectedEmp && (
              <Button variant="ghost" size="sm" icon={Download}
                onClick={() => attApi.exportCsv(selectedEmp, month, year).catch(e => toast.error(e.message))}>
                Export CSV
              </Button>
            )}
          </div>

          {!selectedEmp ? (
            <Card><Empty icon={CalendarCheck} title="Select an employee" desc="Choose from the dropdown above to view attendance history" /></Card>
          ) : empLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
          ) : (
            <div className="grid-2">
              {/* Calendar */}
              <Card>
                <div className="section-title">{monthLabel} Calendar</div>
                {calendarDays && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
                      {['S','M','T','W','T','F','S'].map((d, i) => (
                        <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                      {[...Array(calendarDays.startDay)].map((_, i) => <div key={`e${i}`} />)}
                      {calendarDays.days.map(day => {
                        const ds = format(day, 'yyyy-MM-dd')
                        const status = calendarDays.recordMap[ds]
                        const color = status ? STATUS_COLORS[status] : undefined
                        return (
                          <div key={ds} style={{
                            aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                            background: color ? color + '25' : 'var(--bg-elevated)',
                            border: `1px solid ${color ? color + '50' : 'var(--border-dim)'}`,
                            color: color || 'var(--text-muted)',
                            outline: isToday(day) ? `2px solid var(--accent)` : 'none',
                          }}>
                            {format(day, 'd')}
                          </div>
                        )
                      })}
                    </div>
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                      {Object.entries(STATUS_COLORS).slice(0,5).map(([s, c]) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Summary */}
              <Card>
                <div className="section-title">Month Summary</div>
                {empHistory?.data?.summary && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {Object.entries(empHistory.data.summary).map(([s, count]) => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: `1px solid ${(STATUS_COLORS[s] || '#333') + '30'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 99, background: STATUS_COLORS[s] || 'var(--border-bright)' }} />
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.replace('_',' ')}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: STATUS_COLORS[s] || 'var(--text-muted)' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="section-title" style={{ marginTop: 8 }}>Recent Records</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {empHistory?.data?.records?.slice(0, 8).map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {format(new Date(r.date), 'EEE, MMM d')}
                      </span>
                      <Badge label={r.status} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ── SUMMARY VIEW ──────────────────────────────────────── */}
      {view === 'summary' && (
        <>
          <div className="filter-bar">
            <button className="btn btn-ghost btn-sm" onClick={() => navMonth(-1)}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', minWidth: 130, textAlign: 'center' }}>{monthLabel}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navMonth(1)}><ChevronRight size={14} /></button>
          </div>

          <Table
            loading={summaryLoading}
            columns={[
              { key: 'name', label: 'Employee', render: (v, row) => (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{v}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.role}</div>
                </div>
              )},
              { key: 'PRESENT',  label: 'Present',  render: v => <span style={{ color: 'var(--green)',  fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span> },
              { key: 'ABSENT',   label: 'Absent',   render: v => <span style={{ color: 'var(--red)',    fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span> },
              { key: 'LEAVE',    label: 'Leave',    render: v => <span style={{ color: 'var(--amber)',  fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span> },
              { key: 'HALF_DAY', label: 'Half Day', render: v => <span style={{ color: 'var(--blue)',   fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span> },
              { key: 'totalMarked', label: 'Total', render: v => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span> },
            ]}
            data={summaryList}
            emptyMsg="No attendance data for this month"
          />
        </>
      )}
    </div>
  )
}
