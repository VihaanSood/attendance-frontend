// src/hooks/useApi.js — Reusable data fetching hook
import { useState, useEffect, useCallback, useRef } from 'react'

export function useApi(apiFn, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const mountedRef = useRef(true)

  // Always keep a ref to the latest apiFn so refresh() never uses a stale closure
  const apiFnRef = useRef(apiFn)
  useEffect(() => { apiFnRef.current = apiFn }) // update every render

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const execute = useCallback(async (...args) => {
    setLoading(true); setError(null)
    try {
      const res = await apiFnRef.current(...args)
      if (mountedRef.current) setData(res)
      return res
    } catch (err) {
      if (mountedRef.current) setError(err)
      throw err
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, []) // stable reference — always calls latest apiFnRef

  // Re-run whenever deps change OR a manual refresh is triggered
  useEffect(() => {
    if (immediate) execute()
  }, [...deps, refreshTick]) // eslint-disable-line

  // refresh() bumps the tick, causing the effect above to re-run with fresh state
  const refresh = useCallback(() => setRefreshTick(t => t + 1), [])

  return { data, loading, error, execute, refresh, setData }
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
