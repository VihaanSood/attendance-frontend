// src/components/ui/index.jsx — Shared UI component library

import { useState, useEffect, useRef } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'

/* ── Button ──────────────────────────────────────────────────────── */
export function Button({ children, variant = 'primary', size = 'md', loading, icon: Icon, className = '', ...props }) {
  const base = `btn btn-${variant} btn-${size} ${className}`
  return (
    <button className={base} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  )
}

/* ── Input ───────────────────────────────────────────────────────── */
export function Input({ label, error, hint, icon: Icon, className = '', ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <div className="field-input-wrap">
        {Icon && <Icon size={14} className="field-icon" />}
        <input className={`field-input ${Icon ? 'has-icon' : ''} ${error ? 'is-error' : ''}`} {...props} />
      </div>
      {error && <span className="field-error"><AlertCircle size={11} />{error}</span>}
      {hint && !error && <span className="field-hint">{hint}</span>}
    </div>
  )
}

/* ── Select ──────────────────────────────────────────────────────── */
export function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <select className={`field-input field-select ${error ? 'is-error' : ''}`} {...props}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="field-error"><AlertCircle size={11} />{error}</span>}
    </div>
  )
}

/* ── Card ────────────────────────────────────────────────────────── */
export function Card({ children, className = '', glass, ...props }) {
  return (
    <div className={`card ${glass ? 'card-glass' : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}

/* ── Badge ───────────────────────────────────────────────────────── */
const BADGE_COLORS = {
  PRESENT: 'green', ABSENT: 'red', LEAVE: 'amber', HALF_DAY: 'blue',
  HOLIDAY: 'purple', NOT_MARKED: 'muted', PENDING: 'amber',
  APPROVED: 'green', REJECTED: 'red', ACTIVE: 'green', INACTIVE: 'red',
  SICK: 'red', CASUAL: 'blue', ANNUAL: 'green', UNPAID: 'amber', OTHER: 'muted',
}

export function Badge({ label, color, className = '' }) {
  const c = color || BADGE_COLORS[label] || 'muted'
  return <span className={`badge badge-${c} ${className}`}>{label?.replace('_', ' ')}</span>
}

/* ── Modal ───────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size} animate-up`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

/* ── Toast system ────────────────────────────────────────────────── */
let toastId = 0
const toastListeners = new Set()
export const toast = {
  _emit(type, msg) {
    const id = ++toastId
    toastListeners.forEach(fn => fn({ id, type, msg }))
    return id
  },
  success: (msg) => toast._emit('success', msg),
  error:   (msg) => toast._emit('error', msg),
  info:    (msg) => toast._emit('info', msg),
  warn:    (msg) => toast._emit('warn', msg),
}

export function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const fn = (t) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000)
    }
    toastListeners.add(fn)
    return () => toastListeners.delete(fn)
  }, [])

  const icons = { success: CheckCircle, error: AlertCircle, info: Info, warn: AlertTriangle }

  return (
    <div className="toaster">
      {toasts.map(t => {
        const Icon = icons[t.type]
        return (
          <div key={t.id} className={`toast toast-${t.type} animate-up`}>
            <Icon size={14} />
            <span>{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}><X size={12} /></button>
          </div>
        )
      })}
    </div>
  )
}

/* ── Spinner ─────────────────────────────────────────────────────── */
export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className="animate-spin" style={{ color: 'var(--accent)' }} />
}

/* ── Empty State ─────────────────────────────────────────────────── */
export function Empty({ icon: Icon, title, desc, action }) {
  return (
    <div className="empty-state">
      {Icon && <div className="empty-icon"><Icon size={28} /></div>}
      <h3 className="empty-title">{title}</h3>
      {desc && <p className="empty-desc">{desc}</p>}
      {action}
    </div>
  )
}

/* ── Stat Card ───────────────────────────────────────────────────── */
export function StatCard({ label, value, icon: Icon, color = 'accent', delta, loading }) {
  return (
    <Card className={`stat-card stat-card-${color}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && <div className="stat-icon-wrap"><Icon size={14} /></div>}
      </div>
      {loading
        ? <div className="skeleton" style={{ height: 36, width: 80, marginTop: 8 }} />
        : <div className="stat-value">{value ?? '—'}</div>
      }
      {delta !== undefined && (
        <div className={`stat-delta ${delta >= 0 ? 'pos' : 'neg'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
        </div>
      )}
    </Card>
  )
}

/* ── Table ───────────────────────────────────────────────────────── */
export function Table({ columns, data, loading, emptyMsg = 'No records found', onRowClick }) {
  if (loading) return (
    <div className="table-wrap">
      <table className="table"><thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>{[...Array(5)].map((_, i) => (
          <tr key={i}>{columns.map(c => <td key={c.key}><div className="skeleton" style={{ height: 14, width: '70%' }} /></td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  )

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map(c => <th key={c.key} style={c.width ? { width: c.width } : {}}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {data?.length === 0
            ? <tr><td colSpan={columns.length} className="table-empty">{emptyMsg}</td></tr>
            : data?.map((row, i) => (
              <tr key={row.id || i} className={onRowClick ? 'clickable' : ''} onClick={() => onRowClick?.(row)}>
                {columns.map(c => <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>)}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

/* ── Pagination ──────────────────────────────────────────────────── */
export function Pagination({ pagination, page, setPage }) {
  if (!pagination || pagination.totalPages <= 1) return null
  return (
    <div className="pagination">
      <button disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)} className="page-btn">← Prev</button>
      <span className="page-info">{page} / {pagination.totalPages} &nbsp;·&nbsp; {pagination.total} total</span>
      <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="page-btn">Next →</button>
    </div>
  )
}
