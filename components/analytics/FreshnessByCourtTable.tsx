'use client'

import type { FreshnessRow } from '@/app/analytics/StatsTypes'

interface FreshnessByCourtTableProps {
  rows: FreshnessRow[]
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export function FreshnessByCourtTable({ rows }: FreshnessByCourtTableProps): JSX.Element {
  return (
    <div className="mt-8">
      <div className="text-sm font-medium mb-2">Freshness by Court (latest filing date)</div>
      <div className="overflow-auto border border-border rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2">Court</th>
              <th className="text-left p-2">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.court_id} className="border-t border-border">
                <td className="p-2">{row.court_name}</td>
                <td className="p-2 text-muted-foreground">{formatDate(row.last_update)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

