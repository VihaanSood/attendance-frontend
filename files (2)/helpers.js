// src/utils/helpers.js

export const fmt = {
  currency: (v, symbol = '$') => `${symbol}${Number(v || 0).toLocaleString()}`,
  date: (d, fmt = 'MMM d, yyyy') => {
    if (!d) return '—'
    return new Intl.DateTimeFormat('en-US', { year:'numeric', month:'short', day:'numeric' }).format(new Date(d))
  },
  percent: (v) => `${Number(v || 0).toFixed(1)}%`,
}

export const getInitials = (name = '') =>
  name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

export const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }),
}))

export const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i
  return { value: y, label: String(y) }
})
