// src/pages/HolidaysPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, CalendarDays, CheckCircle, XCircle } from 'lucide-react'
import { holidays as holidayApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Button, Input, Modal, Card, Badge, toast, Empty } from '../components/ui'
import { format, isBefore, isToday as dfIsToday, startOfDay } from 'date-fns'

const EMPTY_FORM = { name: '', date: '', description: '' }

export default function HolidaysPage() {
  const [year, setYear]           = useState(new Date().getFullYear())
  const [open, setOpen]           = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [errors, setErrors]       = useState({})
  const [saving, setSaving]       = useState(false)
  // markedDates: Set of date strings 'YYYY-MM-DD' that are marked as HOLIDAY in attendance
  const [markedDates, setMarkedDates] = useState(new Set())
  // loadingMark: id of holiday currently being (un)marked, null when idle
  const [loadingMark, setLoadingMark] = useState(null)

  const { data, loading, refresh } = useApi(
    () => holidayApi.list({ year }),
    [year]
  )
  const list = data?.data?.data || data?.data || []

  // ── Fetch marked status for all visible holidays ────────────────
  const fetchMarkedDates = useCallback(async (holidays) => {
    if (!holidays.length) return
    const dates = holidays.map(h => h.date.slice(0, 10))
    try {
      const res = await holidayApi.getMarkedDates(dates)
      const marked = res?.data?.data || res?.data || []
      setMarkedDates(new Set(marked))
    } catch { /* non-fatal — UI degrades gracefully */ }
  }, [])

  // Re-check marked status whenever the holiday list changes
  useEffect(() => {
    if (list.length) fetchMarkedDates(list)
    else setMarkedDates(new Set())
  }, [list, fetchMarkedDates])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name required'
    if (!form.date)        e.date = 'Date required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleCreate = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await holidayApi.create(form)
      toast.success(`Holiday "${form.name}" added`)
      setOpen(false); setForm(EMPTY_FORM)
      refresh()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}" from the holiday calendar?`)) return
    try {
      await holidayApi.delete(id)
      toast.success('Holiday removed')
      refresh()
    } catch (err) { toast.error(err.message) }
  }

  // ── Toggle mark / unmark ─────────────────────────────────────────
  const handleToggleMark = async (holiday) => {
    const dateStr  = holiday.date.slice(0, 10)
    const isMarked = markedDates.has(dateStr)
    const label    = format(new Date(holiday.date), 'MMM d, yyyy')

    if (isMarked) {
      if (!confirm(`Unmark HOLIDAY for all employees on ${label}?\nThis will delete their HOLIDAY attendance record for this day.`)) return
    } else {
      if (!confirm(`Mark all employees as HOLIDAY on ${label}?`)) return
    }

    setLoadingMark(holiday.id)
    try {
      if (isMarked) {
        const res = await holidayApi.unmarkAttendance({ date: dateStr })
        const count = res?.data?.data?.unmarked ?? res?.data?.unmarked ?? 0
        toast.success(`Removed HOLIDAY attendance for ${count} employee${count !== 1 ? 's' : ''}`)
        // Remove from local marked set immediately — no need to refetch
        setMarkedDates(prev => { const s = new Set(prev); s.delete(dateStr); return s })
      } else {
        const res = await holidayApi.markAttendance({ date: dateStr })
        const count = res?.data?.data?.marked ?? res?.data?.marked ?? 0
        toast.success(`Marked ${count} employee${count !== 1 ? 's' : ''} as HOLIDAY`)
        // Add to local marked set immediately
        setMarkedDates(prev => new Set([...prev, dateStr]))
      }
    } catch (err) { toast.error(err.message) }
    finally { setLoadingMark(null) }
  }

  const todayStart = startOfDay(new Date())
  const upcoming = list.filter(h => !isBefore(startOfDay(new Date(h.date)), todayStart))
  const past     = list.filter(h =>  isBefore(startOfDay(new Date(h.date)), todayStart))

  // ── Holiday Card ─────────────────────────────────────────────────
  const HolidayCard = ({ h }) => {
    const dateStr  = h.date.slice(0, 10)
    const d        = startOfDay(new Date(h.date))
    const isUpcoming = !isBefore(d, todayStart)
    const isToday    = dfIsToday(new Date(h.date))
    const isMarked   = markedDates.has(dateStr)
    const isBusy     = loadingMark === h.id

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
        background: isToday ? 'var(--accent-dim)' : 'var(--bg-elevated)',
        border: `1px solid ${isToday ? 'var(--accent-glow)' : 'var(--border-dim)'}`,
        borderRadius: 'var(--r-md)', transition: 'border-color 0.15s',
      }}>
        {/* Date badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          background: isUpcoming ? 'var(--accent)' : 'var(--bg-raised)',
          color: isUpcoming ? '#000' : 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{format(new Date(h.date), 'd')}</div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{format(new Date(h.date), 'MMM')}</div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{h.name}</div>
            {/* Attendance status pill */}
            {isMarked && (
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                background: 'var(--green-dim)', color: 'var(--green)',
                border: '1px solid rgba(0,196,113,0.3)',
                padding: '1px 7px', borderRadius: 4,
              }}>✓ Attendance Marked</span>
            )}
          </div>
          {h.description && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{h.description}</div>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {format(new Date(h.date), 'EEEE')}
            {isToday && <Badge label="TODAY" color="accent" style={{ marginLeft: 6 }} />}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {/* Mark / Unmark toggle button */}
          <button
            onClick={() => handleToggleMark(h)}
            disabled={isBusy}
            title={isMarked ? 'Unmark holiday attendance for all employees' : 'Mark all employees as HOLIDAY'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, border: '1px solid', cursor: isBusy ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)',
              opacity: isBusy ? 0.5 : 1,
              transition: 'all 0.15s',
              // Green when unmarked (action = mark), Red when marked (action = unmark)
              background: isMarked ? 'var(--red-dim)'   : 'var(--green-dim)',
              color:      isMarked ? 'var(--red)'       : 'var(--green)',
              borderColor: isMarked ? 'rgba(255,71,87,0.35)' : 'rgba(0,196,113,0.35)',
            }}
          >
            {isBusy ? (
              <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            ) : isMarked ? (
              <XCircle size={13} />
            ) : (
              <CheckCircle size={13} />
            )}
            {isBusy ? '...' : isMarked ? 'Unmark' : 'Mark'}
          </button>

          {/* Delete holiday */}
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(h.id, h.name)} />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-heading">Holiday Calendar</div>
          <div className="page-desc">
            {list.length} holiday{list.length !== 1 ? 's' : ''} in {year}
            {' · '}{upcoming.length} upcoming
            {markedDates.size > 0 && ` · ${markedDates.size} attendance marked`}
          </div>
        </div>
        <div className="page-header-right">
          {/* Year selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[year - 1, year, year + 1].map(y => (
              <button key={y} onClick={() => setYear(y)} style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid', cursor: 'pointer',
                fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600,
                background:   y === year ? 'var(--accent)'      : 'transparent',
                color:        y === year ? '#000'                : 'var(--text-secondary)',
                borderColor:  y === year ? 'var(--accent)'       : 'var(--border-dim)',
              }}>{y}</button>
            ))}
          </div>
          <Button icon={Plus} onClick={() => { setForm(EMPTY_FORM); setErrors({}); setOpen(true) }}>
            Add Holiday
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--green)',  bg: 'var(--green-dim)',  border: 'rgba(0,196,113,0.3)',  icon: '✓', label: 'Mark — no attendance yet' },
          { color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(255,71,87,0.3)',   icon: '✕', label: 'Unmark — attendance already set' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: item.bg, color: item.color, border: `1px solid ${item.border}`, padding: '2px 8px', borderRadius: 4 }}>
              {item.icon}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border-base)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <Empty icon={CalendarDays} title={`No holidays for ${year}`}
            desc="Add public holidays to your organization calendar"
            action={<Button icon={Plus} onClick={() => setOpen(true)}>Add First Holiday</Button>} />
        </Card>
      ) : (
        <div className="grid-2">
          <div>
            <div className="section-title">Upcoming ({upcoming.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.length === 0
                ? <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 16 }}>No upcoming holidays</div>
                : upcoming.map(h => <HolidayCard key={h.id} h={h} />)
              }
            </div>
          </div>
          <div>
            <div className="section-title">Past ({past.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {past.length === 0
                ? <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 16 }}>No past holidays</div>
                : past.slice().reverse().map(h => <HolidayCard key={h.id} h={h} />)
              }
            </div>
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Holiday" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Holiday Name *" value={form.name} onChange={set('name')}
            placeholder="e.g. Independence Day" error={errors.name} />
          <Input label="Date *" type="date" value={form.date} onChange={set('date')} error={errors.date} />
          <div className="field">
            <label className="field-label">Description (optional)</label>
            <textarea className="field-input" value={form.description} onChange={set('description')}
              placeholder="Optional description…"
              style={{ height: 64, resize: 'none', paddingTop: 10, lineHeight: 1.5 }} />
          </div>
        </div>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleCreate}>Add Holiday</Button>
        </div>
      </Modal>
    </div>
  )
}
