// src/services/api.js — Centralized API client for all backend endpoints


const BASE = import.meta.env.VITE_API_URL;
fetch(`${API}/api/auth/login`)

// ── Token management ─────────────────────────────────────────────
export const getToken = () => localStorage.getItem('access_token')
export const setToken = (t) => localStorage.setItem('access_token', t)
export const setRefreshToken = (t) => localStorage.setItem('refresh_token', t)
export const getRefreshToken = () => localStorage.getItem('refresh_token')
export const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

// ── Core fetch wrapper ───────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  // Auto-refresh on 401
  if (res.status === 401 && path !== '/auth/login') {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`
      const retry = await fetch(`${BASE}${path}`, { ...options, headers })
      return handleResponse(retry)
    } else {
      clearTokens()
      window.location.href = '/login'
      return
    }
  }

  return handleResponse(res)
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, message: data.message || 'Request failed', errors: data.errors }
  return data
}

async function tryRefresh() {
  const rt = getRefreshToken()
  if (!rt) return false
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setToken(data.data.accessToken)
    return true
  } catch { return false }
}

// ── File download helper ─────────────────────────────────────────
export async function download(path, filename) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Download failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Auth ─────────────────────────────────────────────────────────
export const auth = {
  register: (d) => request('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
  login:    (d) => request('/auth/login',    { method: 'POST', body: JSON.stringify(d) }),
  me:       ()  => request('/auth/me'),
  changePassword: (d) => request('/auth/change-password', { method: 'PATCH', body: JSON.stringify(d) }),
  logout:   ()  => request('/auth/logout', { method: 'POST' }),
}

// ── Employees ────────────────────────────────────────────────────
export const employees = {
  list:        (params = {}) => request('/employees?' + new URLSearchParams(params)),
  get:         (id)          => request(`/employees/${id}`),
  create:      (d)           => request('/employees',    { method: 'POST',  body: JSON.stringify(d) }),
  update:      (id, d)       => request(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete:      (id)          => request(`/employees/${id}`, { method: 'DELETE' }),
  departments: ()            => request('/employees/departments'),
}

// ── Attendance ───────────────────────────────────────────────────
export const attendance = {
  mark:           (d)         => request('/attendance/mark',      { method: 'POST', body: JSON.stringify(d) }),
  bulkMark:       (d)         => request('/attendance/bulk-mark', { method: 'POST', body: JSON.stringify(d) }),
  daily:          (date, p)   => request(`/attendance/daily/${date}?` + new URLSearchParams(p)),
  employee:       (id, p)     => request(`/attendance/employee/${id}?` + new URLSearchParams(p)),
  summary:        (p)         => request('/attendance/summary?' + new URLSearchParams(p)),
  delete:         (id)        => request(`/attendance/${id}`, { method: 'DELETE' }),
  exportCsv:      (id, month, year) => download(
    `/attendance/employee/${id}/export?month=${month}&year=${year}`,
    `attendance_${id}_${year}_${month}.csv`
  ),
}

// ── Salary ───────────────────────────────────────────────────────
export const salary = {
  payroll:   (p)  => request('/salary/payroll?' + new URLSearchParams(p)),
  employee:  (id, p) => request(`/salary/employee/${id}?` + new URLSearchParams(p)),
  exportCsv: (month, year) => download(`/salary/payroll/export/csv?month=${month}&year=${year}`, `payroll_${year}_${month}.csv`),
  exportPdf: (month, year) => download(`/salary/payroll/export/pdf?month=${month}&year=${year}`, `payroll_${year}_${month}.pdf`),
}

// ── Leaves ───────────────────────────────────────────────────────
export const leaves = {
  list:   (p)       => request('/leaves?' + new URLSearchParams(p)),
  create: (d)       => request('/leaves',        { method: 'POST',  body: JSON.stringify(d) }),
  review: (id, d)   => request(`/leaves/${id}/review`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (id)      => request(`/leaves/${id}`,  { method: 'DELETE' }),
}

// ── Holidays ─────────────────────────────────────────────────────
export const holidays = {
  list:             (p)      => request('/holidays?' + new URLSearchParams(p)),
  create:           (d)      => request('/holidays', { method: 'POST', body: JSON.stringify(d) }),
  delete:           (id)     => request(`/holidays/${id}`, { method: 'DELETE' }),
  markAttendance:   (d)      => request('/holidays/mark-attendance',   { method: 'POST',   body: JSON.stringify(d) }),
  unmarkAttendance: (d)      => request('/holidays/unmark-attendance', { method: 'DELETE', body: JSON.stringify(d) }),
  getMarkedDates:   (dates)  => request('/holidays/marked-dates?' + new URLSearchParams({ dates: dates.join(',') })),
}

// ── Dashboard ────────────────────────────────────────────────────
export const dashboard = {
  overview: ()  => request('/dashboard'),
  trend:    (p) => request('/dashboard/trend?' + new URLSearchParams(p)),
}

// ── Settings ─────────────────────────────────────────────────────
export const settings = {
  get:    ()  => request('/settings'),
  update: (d) => request('/settings', { method: 'PUT', body: JSON.stringify(d) }),
}
