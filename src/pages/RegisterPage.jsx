// src/pages/RegisterPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Building2 } from 'lucide-react'
import { useAuth } from '../store/authStore'
import { Button, Input, toast } from '../components/ui'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', organization: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'Name required'
    if (!form.email) e.email = 'Email required'
    if (!form.organization) e.organization = 'Organization required'
    if (form.password.length < 8) e.password = 'Min 8 characters'
    if (!/[A-Z]/.test(form.password)) e.password = 'Needs an uppercase letter'
    if (!/[0-9]/.test(form.password)) e.password = 'Needs a number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome aboard.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
      if (err.errors) {
        const mapped = {}
        err.errors.forEach(e => { mapped[e.path] = e.msg })
        setErrors(mapped)
      }
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

        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-sub">Already registered? <Link to="/login">Sign in →</Link></p>

        <form onSubmit={handleSubmit}>
          <div className="auth-fields">
            <Input label="Full Name" icon={User} value={form.name} onChange={set('name')}
              placeholder="Jane Doe" error={errors.name} />
            <Input label="Organization" icon={Building2} value={form.organization} onChange={set('organization')}
              placeholder="Acme Corp" error={errors.organization} />
            <Input label="Email Address" type="email" icon={Mail} value={form.email} onChange={set('email')}
              placeholder="you@company.com" error={errors.email} />
            <Input label="Password" type="password" icon={Lock} value={form.password} onChange={set('password')}
              placeholder="Min 8 chars, 1 uppercase, 1 number" error={errors.password} />
          </div>
          <Button type="submit" loading={loading} className="btn-lg" style={{ width: '100%' }}>
            Create Account
          </Button>
        </form>
      </div>
    </div>
  )
}
