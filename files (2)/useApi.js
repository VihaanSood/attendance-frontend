// src/hooks/useApi.js — Reusable data fetching hook
import { useState, useEffect, useCallback, useRef } from 'react'

export function useApi(apiFn, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const execute = useCallback(async (...args) => {
    setLoading(true); setError(null)
    try {
      const res = await apiFn(...args)
      if (mountedRef.current) setData(res?.data ?? res)
      return res
    } catch (err) {
      if (mountedRef.current) setError(err)
      throw err
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => { if (immediate) execute() }, [execute]) // eslint-disable-line

  return { data, loading, error, execute, setData }
}

// Paginated data hook
export function usePaginated(apiFn, params = {}, deps = []) {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [allParams, setAllParams] = useState(params)

  const { data, loading, error, execute } = useApi(
    () => apiFn({ ...allParams, page, limit }),
    [page, JSON.stringify(allParams), ...deps]
  )

  const updateParams = useCallback((newParams) => {
    setAllParams(p => ({ ...p, ...newParams }))
    setPage(1)
  }, [])

  return {
    items: data?.data || data || [],
    pagination: data?.pagination || null,
    loading, error, page, setPage, updateParams, refresh: execute,
  }
}
