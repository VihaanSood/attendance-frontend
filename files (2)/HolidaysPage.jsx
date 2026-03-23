// src/pages/HolidaysPage.jsx
import { useState } from 'react'
import { Plus, Trash2, CalendarDays, Zap } from 'lucide-react'
import { holidays as holidayApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Button, Input, Modal, Card, Badge, toast, Empty } from '../components/ui'
import { format, isAfter, isBefore, isToday as dfIsToday } from 'date-fns'

const EMPTY_FORM = { name: '', date: '', description: '' }

export default function HolidaysPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [markingId, setMarkingId] = useState(null)

  const { data, loading, execute: refresh } = useApi(
    () => holidayApi.list({ year }),
    [year]
  )
  const list = data?.data || []

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name required'
    if (!form.date) e.date = 'Date required'
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

  const handleMarkAttendance = async (holiday) => {
    if (!confirm(`Mark all employees as HOLIDAY on ${format(new Date(holiday.date), 'MMM d, yyyy')}?`)) return
    setMarkingId(holiday.id)
    try {
      const res = await holidayApi.markAttendance({ date: holiday.date.slice(0, 10) })
      toast.success(`Marked ${res.data.marked} employees as HOLIDAY`)
    } catch (err) { toast.error(err.message) }
    finally { setMarkingId(null) }
  }

  const today = new Date()
  const upcoming = list.filter(h => isAfter(new Date(h.date), today))
  const past     = list.filter(h => isBefore(new Date(h.date), today))

  const HolidayCard = ({ h }) => {
    const d = new Date(h.date)
    const isUpcoming = isAfter(d, today)
    const isToday    = dfIsToday(d)
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
        background: isToday ? 'var(--accent-dim)' : 'var(--bg-elevated)',
        border: `1px solid ${isToday ? 'var(--accent-glow)' : 'var(--border-dim)'}`,
        borderRadius: 'var(--r-md)', transition: 'border-color 0.15s',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          background: isUpcoming ? 'var(--accent)' : 'var(--bg-raised)',
          color: isUpcoming ? '#000' : 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{format(d, 'd')}</div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{format(d, 'MMM')}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{h.name}</div>
          {h.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{h.description}</div>}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {format(d, 'EEEE')} {isToday && <Badge label="TODAY" color="accent" />}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="ghost" size="sm" icon={Zap}
            loading={markingId === h.id}
            onClick={() => handleMarkAttendance(h)}
            title="Mark all employees as HOLIDAY">
            Mark
          </Button>
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
          <div className="page-desc">{list.length} holidays in {year} · {upcoming.length} upcoming</div>
        </div>
        <div className="page-header-right">
          <div style={{ display: 'flex', gap: 6 }}>
            {[year - 1, year, year + 1].map(y => (
              <button key={y} onClick={() => setYear(y)} style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 12,
                fontFamily: 'var(--font-mono)', fontWeight: 600,
                background: y === year ? 'var(--accent)' : 'transparent',
                color: y === year ? '#000' : 'var(--text-secondary)',
                borderColor: y === year ? 'var(--accent)' : 'var(--border-dim)',
              }}>{y}</button>
            ))}
          </div>
          <Button icon={Plus} onClick={() => { setForm(EMPTY_FORM); setErrors({}); setOpen(true) }}>Add Holiday</Button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border-base)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
        </div>
      ) : list.length === 0 ? (
        <Card><Empty icon={CalendarDays} title={`No holidays for ${year}`} desc="Add public holidays to your organization calendar"
          action={<Button icon={Plus} onClick={() => setOpen(true)}>Add First Holiday</Button>} /></Card>
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add Holiday" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Holiday Name *" value={form.name} onChange={set('name')}
            placeholder="e.g. Independence Day" error={errors.name} />
          <Input label="Date *" type="date" value={form.date} onChange={set('date')} error={errors.date} />
          <div className="field">
            <label className="field-label">Description (optional)</label>
            <textarea className="field-input" value={form.description} onChange={set('description')}
              placeholder="Optional description…" style={{ height: 64, resize: 'none', paddingTop: 10, lineHeight: 1.5 }} />
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
