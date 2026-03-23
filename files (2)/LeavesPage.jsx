// src/pages/LeavesPage.jsx
import { useState } from 'react'
import { Plus, CheckCircle, XCircle, Trash2, UmbrellaOff } from 'lucide-react'
import { leaves as leavesApi, employees as empApi } from '../services/api'
import { useApi, usePaginated } from '../hooks/useApi'
import { Button, Badge, Modal, Input, Select, Table, toast, Empty, Pagination } from '../components/ui'
import { format, differenceInCalendarDays } from 'date-fns'

const LEAVE_TYPES = [
  { value: '',         label: 'All Types' },
  { value: 'SICK',     label: 'Sick Leave' },
  { value: 'CASUAL',   label: 'Casual Leave' },
  { value: 'ANNUAL',   label: 'Annual Leave' },
  { value: 'UNPAID',   label: 'Unpaid Leave' },
  { value: 'OTHER',    label: 'Other' },
]

const STATUS_FILTER = [
  { value: '',         label: 'All Statuses' },
  { value: 'PENDING',  label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

const EMPTY_FORM = { employeeId: '', startDate: '', endDate: '', type: 'SICK', reason: '' }

export default function LeavesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data: empData } = useApi(() => empApi.list({ limit: 200, isActive: true }), [])
  const empList = empData?.data || []

  const { data: leavesData, loading, execute: refresh } = useApi(
    () => leavesApi.list({ status: statusFilter, type: typeFilter, page, limit: 15 }),
    [statusFilter, typeFilter, page]
  )

  const leaves = leavesData?.data || []
  const pagination = leavesData?.pagination

  const set = k => e => setForm(f => ({ ...f, [k]: typeof e === 'string' ? e : e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.employeeId) e.employeeId = 'Select an employee'
    if (!form.startDate)  e.startDate = 'Required'
    if (!form.endDate)    e.endDate = 'Required'
    if (!form.reason.trim()) e.reason = 'Reason is required'
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = 'End must be after start'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleCreate = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await leavesApi.create(form)
      toast.success('Leave request submitted')
      setCreateOpen(false); setForm(EMPTY_FORM)
      refresh()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleReview = async (id, status, name) => {
    const label = status === 'APPROVED' ? 'approve' : 'reject'
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} leave for ${name}?`)) return
    try {
      await leavesApi.review(id, { status })
      toast.success(`Leave ${status.toLowerCase()}`)
      if (status === 'APPROVED') toast.info('Attendance auto-marked as LEAVE for the date range')
      refresh()
    } catch (err) { toast.error(err.message) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Cancel leave request for ${name}?`)) return
    try {
      await leavesApi.delete(id)
      toast.success('Leave request cancelled')
      refresh()
    } catch (err) { toast.error(err.message) }
  }

  const cols = [
    { key: 'employee', label: 'Employee', render: (v) => (
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{v?.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v?.role}</div>
      </div>
    )},
    { key: 'type', label: 'Type', render: v => <Badge label={v} /> },
    { key: 'startDate', label: 'Period', render: (v, row) => {
      const days = differenceInCalendarDays(new Date(row.endDate), new Date(row.startDate)) + 1
      return (
        <div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {format(new Date(v), 'MMM d')} – {format(new Date(row.endDate), 'MMM d, yyyy')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{days} day{days > 1 ? 's' : ''}</div>
        </div>
      )
    }},
    { key: 'reason', label: 'Reason', render: v => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v}</span> },
    { key: 'status', label: 'Status', render: v => <Badge label={v} /> },
    { key: 'createdAt', label: 'Submitted', render: v => (
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {format(new Date(v), 'MMM d, yyyy')}
      </span>
    )},
    { key: 'id', label: '', render: (v, row) => (
      <div style={{ display: 'flex', gap: 4 }}>
        {row.status === 'PENDING' && (
          <>
            <Button variant="success" size="sm" icon={CheckCircle}
              onClick={() => handleReview(v, 'APPROVED', row.employee?.name)}>Approve</Button>
            <Button variant="danger"  size="sm" icon={XCircle}
              onClick={() => handleReview(v, 'REJECTED', row.employee?.name)}>Reject</Button>
          </>
        )}
        {row.status === 'PENDING' && (
          <Button variant="ghost" size="sm" icon={Trash2}
            onClick={() => handleDelete(v, row.employee?.name)} />
        )}
      </div>
    ), width: 200 },
  ]

  // Count pending
  const pendingCount = leaves.filter(l => l.status === 'PENDING').length

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-heading">Leave Requests</div>
          <div className="page-desc">{pagination?.total ?? '—'} total · {pendingCount} pending review</div>
        </div>
        <Button icon={Plus} onClick={() => { setForm(EMPTY_FORM); setErrors({}); setCreateOpen(true) }}>New Request</Button>
      </div>

      <div className="filter-bar">
        <select className="field-input field-select" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          style={{ width: 160, height: 34, fontSize: 12 }}>
          {STATUS_FILTER.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="field-input field-select" value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          style={{ width: 160, height: 34, fontSize: 12 }}>
          {LEAVE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <Table columns={cols} data={leaves} loading={loading} emptyMsg="No leave requests found" />
      <Pagination pagination={pagination} page={page} setPage={setPage} />

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Submit Leave Request" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="field-label">Employee *</label>
            <select className={`field-input field-select ${errors.employeeId ? 'is-error' : ''}`}
              value={form.employeeId} onChange={set('employeeId')}>
              <option value="">Select employee…</option>
              {empList.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
            </select>
            {errors.employeeId && <span className="field-error">{errors.employeeId}</span>}
          </div>

          <div className="form-grid">
            <Input label="Start Date *" type="date" value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
            <Input label="End Date *"   type="date" value={form.endDate}   onChange={set('endDate')}   error={errors.endDate} />
          </div>

          <div className="field">
            <label className="field-label">Leave Type *</label>
            <select className="field-input field-select" value={form.type} onChange={set('type')}>
              {LEAVE_TYPES.slice(1).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Reason *</label>
            <textarea className={`field-input ${errors.reason ? 'is-error' : ''}`}
              value={form.reason} onChange={set('reason')}
              placeholder="Brief description of the reason…"
              style={{ height: 80, resize: 'none', paddingTop: 10, lineHeight: 1.5 }} />
            {errors.reason && <span className="field-error">{errors.reason}</span>}
          </div>

          {form.startDate && form.endDate && form.endDate >= form.startDate && (
            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
              📅 {differenceInCalendarDays(new Date(form.endDate), new Date(form.startDate)) + 1} days selected
            </div>
          )}
        </div>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleCreate}>Submit Request</Button>
        </div>
      </Modal>
    </div>
  )
}
