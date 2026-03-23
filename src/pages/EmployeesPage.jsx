// src/pages/EmployeesPage.jsx
import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, User, Mail, Phone, Calendar, DollarSign, Building, Briefcase } from 'lucide-react'
import { employees as empApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Button, Input, Select, Modal, Table, Badge, toast, Empty, Pagination } from '../components/ui'
import { format } from 'date-fns'

const EMPTY_FORM = { name:'', age:'', salary:'', role:'', department:'', joiningDate:'', email:'', phone:'' }

export default function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const { data, loading, refresh } = useApi(
    () => empApi.list({ page, limit: 10, search }),
    [page, search]
  )

  const items = data?.data?.data || data?.data || []
  const pagination = data?.data?.pagination || data?.pagination

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true) }
  const openEdit = (emp) => {
    setEditTarget(emp)
    setForm({
      name: emp.name, age: String(emp.age), salary: String(emp.salary),
      role: emp.role, department: emp.department || '', email: emp.email || '',
      phone: emp.phone || '', joiningDate: emp.joiningDate?.slice(0,10) || '',
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.name)        e.name = 'Required'
    if (!form.age || isNaN(form.age)) e.age = 'Valid age required'
    if (!form.salary || isNaN(form.salary)) e.salary = 'Valid salary required'
    if (!form.role)        e.role = 'Required'
    if (!form.joiningDate) e.joiningDate = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { ...form, age: Number(form.age), salary: Number(form.salary) }
      if (editTarget) {
        await empApi.update(editTarget.id, payload)
        toast.success('Employee updated')
      } else {
        await empApi.create(payload)
        toast.success('Employee created')
      }
      setModalOpen(false)
      refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (emp) => {
    if (!confirm(`Deactivate ${emp.name}? They can be reactivated later.`)) return
    try {
      await empApi.delete(emp.id)
      toast.success(`${emp.name} deactivated`)
      refresh()
    } catch (err) { toast.error(err.message) }
  }

  const cols = [
    { key: 'name', label: 'Employee', render: (v, row) => (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--accent)', flexShrink:0 }}>
          {v?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{v}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{row.email || '—'}</div>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: v => <span style={{ fontSize:12 }}>{v}</span> },
    { key: 'department', label: 'Dept', render: v => v ? <Badge label={v} color="blue" /> : '—' },
    { key: 'salary', label: 'Salary', render: v => <span style={{ fontFamily:'var(--font-mono)', color:'var(--green)' }}>${Number(v).toLocaleString()}</span> },
    { key: 'joiningDate', label: 'Joined', render: v => <span style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{v ? format(new Date(v), 'MMM d, yyyy') : '—'}</span> },
    { key: 'isActive', label: 'Status', render: v => <Badge label={v ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'id', label: '', render: (v, row) => (
      <div style={{ display:'flex', gap:6 }}>
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(row)} />
        <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(row)} />
      </div>
    ), width: 90 },
  ]

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-heading">Employees</div>
          <div className="page-desc">{pagination?.total ?? '—'} total members</div>
        </div>
        <Button icon={Plus} onClick={openCreate}>Add Employee</Button>
      </div>

      <div className="filter-bar">
        <div className="field-input-wrap search-input">
          <Search size={13} className="field-icon" />
          <input className="field-input has-icon" placeholder="Search name, role, dept…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <Table columns={cols} data={items} loading={loading} emptyMsg="No employees found. Add your first one!" />
      <Pagination pagination={pagination} page={page} setPage={setPage} />

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Employee' : 'Add New Employee'} size="lg">
        <div className="form-grid">
          <Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="Alice Johnson" error={errors.name} icon={User} />
          <Input label="Age *" type="number" value={form.age} onChange={set('age')} placeholder="28" error={errors.age} />
          <Input label="Monthly Salary *" type="number" value={form.salary} onChange={set('salary')} placeholder="5000" error={errors.salary} icon={DollarSign} />
          <Input label="Role / Position *" value={form.role} onChange={set('role')} placeholder="Software Engineer" error={errors.role} icon={Briefcase} />
          <Input label="Department" value={form.department} onChange={set('department')} placeholder="Engineering" icon={Building} />
          <Input label="Joining Date *" type="date" value={form.joiningDate} onChange={set('joiningDate')} error={errors.joiningDate} icon={Calendar} />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="alice@corp.com" icon={Mail} />
          <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+1-555-0101" icon={Phone} />
        </div>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>{editTarget ? 'Save Changes' : 'Create Employee'}</Button>
        </div>
      </Modal>
    </div>
  )
}
