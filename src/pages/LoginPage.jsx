// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../store/authStore'
import { Button, Input, toast } from '../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    if (!form.email) { setErrors({ email: 'Email required' }); return }
    if (!form.password) { setErrors({ password: 'Password required' }); return }

    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
      setErrors({ general: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-mark">W</div>
            <div>
              <div className="brand-name">WorkForce</div>
              <div className="brand-tagline">HR & ATTENDANCE PLATFORM</div>
            </div>
          </div>
        </div>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">
          Don't have an account? <Link to="/register">Create one →</Link>
        </p>

        {errors.general && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-fields">
            <Input label="Email Address" type="email" icon={Mail}
              value={form.email} onChange={set('email')}
              placeholder="you@company.com" error={errors.email} autoComplete="email" />
            <Input label="Password" type="password" icon={Lock}
              value={form.password} onChange={set('password')}
              placeholder="••••••••" error={errors.password} autoComplete="current-password" />
          </div>
          <Button type="submit" loading={loading} className="btn-lg" style={{ width: '100%' }}>
            Sign In
          </Button>
        </form>

        <p className="auth-footer">
          Demo: <code style={{ color: 'var(--accent)', fontSize: 11 }}>demo@company.com</code> / <code style={{ color: 'var(--accent)', fontSize: 11 }}>Demo@1234</code>
        </p>
      </div>
    </div>
  )
}
