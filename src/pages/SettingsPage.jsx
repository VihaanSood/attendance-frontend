// src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react'
import { Settings, Shield, Building, Key } from 'lucide-react'
import { settings as settingsApi, auth as authApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../store/authStore'
import { Button, Input, Card, toast } from '../components/ui'

const CURRENCIES = ['USD','EUR','GBP','INR','AUD','CAD','SGD','AED']
const TIMEZONES  = ['UTC','America/New_York','America/Los_Angeles','Europe/London','Asia/Kolkata','Asia/Singapore','Asia/Tokyo','Australia/Sydney']

export default function SettingsPage() {
  const { user } = useAuth()
  const { data, loading, execute: refresh } = useApi(() => settingsApi.get(), [])

  const [orgForm, setOrgForm]     = useState({ workingDays: 26, currency: 'USD', timezone: 'UTC' })
  const [pwForm, setPwForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingOrg, setSavingOrg] = useState(false)
  const [savingPw, setSavingPw]   = useState(false)
  const [pwErrors, setPwErrors]   = useState({})

  useEffect(() => {
    if (data?.data?.data || data?.data) {
      const s = data.data?.data || data.data
      setOrgForm({ workingDays: s.workingDays || 26, currency: s.currency || 'USD', timezone: s.timezone || 'UTC' })
    }
  }, [data])

  const setOrg = k => e => setOrgForm(f => ({ ...f, [k]: e.target.value }))
  const setPw  = k => e => setPwForm(f => ({ ...f, [k]: e.target.value }))

  const handleSaveOrg = async () => {
    setSavingOrg(true)
    try {
      await settingsApi.update({ ...orgForm, workingDays: Number(orgForm.workingDays) })
      toast.success('Settings saved')
      refresh()
    } catch (err) { toast.error(err.message) }
    finally { setSavingOrg(false) }
  }

  const handleChangePw = async () => {
    const e = {}
    if (!pwForm.currentPassword) e.currentPassword = 'Required'
    if (pwForm.newPassword.length < 8) e.newPassword = 'Min 8 characters'
    if (pwForm.newPassword !== pwForm.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setPwErrors(e)
    if (Object.keys(e).length) return

    setSavingPw(true)
    try {
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed successfully')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPwErrors({})
    } catch (err) { toast.error(err.message) }
    finally { setSavingPw(false) }
  }

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-heading">Settings</div>
          <div className="page-desc">Manage your organization configuration</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>

        {/* Organization info */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <Building size={14} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Organization</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Account and company information</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div className="field">
              <label className="field-label">Admin Name</label>
              <div className="field-input" style={{ display: 'flex', alignItems: 'center', opacity: 0.6, cursor: 'not-allowed' }}>{user?.name}</div>
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <div className="field-input" style={{ display: 'flex', alignItems: 'center', opacity: 0.6, cursor: 'not-allowed', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{user?.email}</div>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Organization Name</label>
              <div className="field-input" style={{ display: 'flex', alignItems: 'center', opacity: 0.6, cursor: 'not-allowed' }}>{user?.organization}</div>
            </div>
          </div>
          <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', border: '1px solid var(--border-dim)' }}>
            To update your name, email, or organization, contact support.
          </div>
        </Card>

        {/* Payroll settings */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <Settings size={14} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Payroll Configuration</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Working days and salary calculation settings</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div className="field">
              <label className="field-label">Working Days / Month</label>
              <input type="number" className="field-input" min={1} max={31}
                value={orgForm.workingDays} onChange={setOrg('workingDays')} />
              <span className="field-hint">Used for salary_per_day calculation</span>
            </div>
            <div className="field">
              <label className="field-label">Currency</label>
              <select className="field-input field-select" value={orgForm.currency} onChange={setOrg('currency')}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Timezone</label>
              <select className="field-input field-select" value={orgForm.timezone} onChange={setOrg('timezone')}>
                {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Formula preview */}
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-dim)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Formula Preview</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', lineHeight: 2 }}>
              <div>salary_per_day = monthly_salary / <strong>{orgForm.workingDays}</strong></div>
              <div>effective_days = present_days + (half_days × 0.5)</div>
              <div>final_salary = effective_days × salary_per_day</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button loading={savingOrg} onClick={handleSaveOrg}>Save Settings</Button>
          </div>
        </Card>

        {/* Change password */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)' }}>
              <Key size={14} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Change Password</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Update your account password</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Current Password" type="password" value={pwForm.currentPassword}
              onChange={setPw('currentPassword')} error={pwErrors.currentPassword} placeholder="••••••••" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="New Password" type="password" value={pwForm.newPassword}
                onChange={setPw('newPassword')} error={pwErrors.newPassword} placeholder="Min 8 chars" />
              <Input label="Confirm Password" type="password" value={pwForm.confirmPassword}
                onChange={setPw('confirmPassword')} error={pwErrors.confirmPassword} placeholder="Repeat password" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="secondary" loading={savingPw} onClick={handleChangePw} icon={Shield}>Update Password</Button>
          </div>
        </Card>

        {/* System info */}
        <Card>
          <div className="section-title">System Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'API Version',  value: 'v1.0.0' },
              { label: 'Auth Method',  value: 'JWT Bearer' },
              { label: 'Database',     value: 'PostgreSQL + Prisma' },
              { label: 'Backend',      value: 'Node.js + Express' },
              { label: 'Rate Limit',   value: '100 req / 15 min' },
              { label: 'Token Expiry', value: '7 days' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  )
}
