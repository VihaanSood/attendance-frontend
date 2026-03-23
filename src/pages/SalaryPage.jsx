// src/pages/SalaryPage.jsx
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, DollarSign, TrendingUp, Users, Calculator } from 'lucide-react'
import { salary as salaryApi, employees as empApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Button, Card, StatCard, Table, Modal, toast, Spinner, Empty } from '../components/ui'
import { format } from 'date-fns'

export default function SalaryPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year,  setYear]  = useState(new Date().getFullYear())
  const [detailEmp, setDetailEmp] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [exporting, setExporting] = useState('')

  const { data: payrollData, loading } = useApi(
    () => salaryApi.payroll({ month, year }),
    [month, year]
  )

  const report = payrollData?.data?.data || payrollData?.data
  const payroll = report?.payroll || []
  const currency = report?.currency || ''

  const navMonth = (dir) => {
    let m = month + dir, y = year
    if (m < 1)  { m = 12; y-- }
    if (m > 12) { m = 1;  y++ }
    setMonth(m); setYear(y)
  }

  const openDetail = async (row) => {
    setDetailEmp(row)
    setLoadingDetail(true)
    try {
      const res = await salaryApi.employee(row.employeeId, { month, year })
      setDetailData(res?.data?.data || res?.data)
    } catch (err) { toast.error(err.message) }
    finally { setLoadingDetail(false) }
  }

  const handleExport = async (type) => {
    setExporting(type)
    try {
      if (type === 'csv') await salaryApi.exportCsv(month, year)
      else await salaryApi.exportPdf(month, year)
      toast.success(`${type.toUpperCase()} exported successfully`)
    } catch (err) { toast.error(err.message) }
    finally { setExporting('') }
  }

  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy')

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-heading">Payroll</div>
          <div className="page-desc">Salary calculation based on attendance</div>
        </div>
        <div className="page-header-right">
          <Button variant="ghost" size="sm" icon={Download} loading={exporting === 'csv'}
            onClick={() => handleExport('csv')}>CSV</Button>
          <Button variant="ghost" size="sm" icon={Download} loading={exporting === 'pdf'}
            onClick={() => handleExport('pdf')}>PDF</Button>
        </div>
      </div>

      {/* Month selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navMonth(-1)}><ChevronLeft size={14} /></button>
        <div style={{
          padding: '6px 20px', background: 'var(--bg-raised)', border: '1px solid var(--border-base)',
          borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', minWidth: 160, textAlign: 'center'
        }}>{monthLabel}</div>
        <button className="btn btn-ghost btn-sm" onClick={() => navMonth(1)}><ChevronRight size={14} /></button>
      </div>

      {/* Summary stats */}
      <div className="grid-4 section">
        <StatCard label="Total Payroll"   value={report ? `${currency} ${report.totalPayroll?.toLocaleString()}` : '—'} icon={DollarSign}   color="accent" loading={loading} />
        <StatCard label="Employees"       value={report?.totalEmployees} icon={Users}       color="blue"  loading={loading} />
        <StatCard label="Working Days"    value={report?.configuredWorkDays} icon={Calculator} color="green" loading={loading} />
        <StatCard label="Currency"        value={report?.currency} icon={TrendingUp}   color="amber" loading={loading} />
      </div>

      {/* Salary formula card */}
      <Card className="section" style={{ background: 'linear-gradient(135deg, var(--bg-raised), var(--bg-elevated))', borderColor: 'var(--border-base)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Salary Formula</div>
          {[
            `salary_per_day = monthly_salary / ${report?.configuredWorkDays || 26}`,
            'effective_days = present + (half_days × 0.5)',
            'final_salary = effective_days × salary_per_day',
          ].map((f, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '4px 10px', borderRadius: 4 }}>
              {f}
            </div>
          ))}
        </div>
      </Card>

      {/* Payroll table */}
      <Table
        loading={loading}
        onRowClick={openDetail}
        columns={[
          { key: 'name', label: 'Employee', render: (v, row) => (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.role} · {row.department || 'N/A'}</div>
            </div>
          )},
          { key: 'monthlySalary', label: 'Monthly Salary',
            render: v => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{currency} {Number(v).toLocaleString()}</span> },
          { key: 'attendance', label: 'P / A / L',
            render: v => (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <span style={{ color: 'var(--green)' }}>{v?.PRESENT || 0}</span>
                {' / '}
                <span style={{ color: 'var(--red)' }}>{v?.ABSENT || 0}</span>
                {' / '}
                <span style={{ color: 'var(--amber)' }}>{v?.LEAVE || 0}</span>
              </span>
            )},
          { key: 'effectiveDays', label: 'Effective Days',
            render: v => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span> },
          { key: 'salaryPerDay', label: 'Per Day',
            render: v => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{currency} {Number(v).toFixed(2)}</span> },
          { key: 'deductionAmount', label: 'Deduction',
            render: v => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>-{currency} {Number(v).toFixed(2)}</span> },
          { key: 'finalSalary', label: 'Final Salary',
            render: v => (
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: 'var(--green)' }}>
                {currency} {Number(v).toLocaleString()}
              </span>
            )},
        ]}
        data={payroll}
        emptyMsg="No payroll data — mark attendance for this month first"
      />
      {payroll.length > 0 && (
        <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-dim)', borderRadius: '0 0 var(--r-md) var(--r-md)', display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Payroll:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>
            {report?.currency} {report?.totalPayroll?.toLocaleString()}
          </span>
        </div>
      )}

      {/* Employee detail modal */}
      <Modal open={!!detailEmp} onClose={() => { setDetailEmp(null); setDetailData(null) }}
        title={`Salary Breakdown — ${detailEmp?.name}`} size="md">
        {loadingDetail ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : detailData ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Monthly Salary',    value: `${currency} ${Number(detailData.monthlySalary).toLocaleString()}`,  color: 'var(--text-primary)' },
                { label: 'Salary / Day',      value: `${currency} ${detailData.salaryPerDay}`,                             color: 'var(--accent)' },
                { label: 'Present Days',      value: detailData.attendance?.PRESENT || 0,                      color: 'var(--green)' },
                { label: 'Absent Days',       value: detailData.attendance?.ABSENT  || 0,                      color: 'var(--red)' },
                { label: 'Leave Days',        value: detailData.attendance?.LEAVE   || 0,                      color: 'var(--amber)' },
                { label: 'Half Days',         value: detailData.attendance?.HALF_DAY|| 0,                      color: 'var(--blue)' },
                { label: 'Effective Days',    value: detailData.effectiveDays,                                 color: 'var(--text-primary)' },
                { label: 'Deduction',         value: `-${currency} ${detailData.deductionAmount}`,                        color: 'var(--red)' },
              ].map(item => (
                <div key={item.label} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-dim)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 20px', background: 'var(--accent-dim)', borderRadius: 10, border: '1px solid var(--accent-glow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Final Salary</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 24, color: 'var(--accent)' }}>
                {currency} {Number(detailData.finalSalary).toLocaleString()}
              </span>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
