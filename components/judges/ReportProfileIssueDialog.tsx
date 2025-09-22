'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, Send } from 'lucide-react'

interface ReportProfileIssueDialogProps {
  judgeSlug: string
  courtId?: string | null
}

const ISSUE_OPTIONS = [
  { value: 'data_accuracy', label: 'Data accuracy or coverage' },
  { value: 'bias_context', label: 'Bias context clarification' },
  { value: 'assignment_change', label: 'Assignment change or history' },
  { value: 'ads_or_policy', label: 'Advertising or policy concern' },
  { value: 'other', label: 'Something else' },
] as const

export function ReportProfileIssueDialog({ judgeSlug, courtId }: ReportProfileIssueDialogProps) {
  const [open, setOpen] = useState(false)
  const [issueType, setIssueType] = useState<typeof ISSUE_OPTIONS[number]['value']>('data_accuracy')
  const [details, setDetails] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setIssueType('data_accuracy')
    setDetails('')
    setEmail('')
    setMessage(null)
    setError(null)
  }, [])

  const closeDialog = useCallback(() => {
    setOpen(false)
    resetForm()
  }, [resetForm])

  useEffect(() => {
    const handler = () => setOpen(true)
    document.addEventListener('open-report-profile-issue', handler)
    return () => document.removeEventListener('open-report-profile-issue', handler)
  }, [])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDialog()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, closeDialog])

  const disabled = submitting || details.trim().length < 10

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled) return

    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/report-profile-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          judgeSlug,
          courtId: courtId ?? undefined,
          issueType,
          details,
          reporterEmail: email.trim() || undefined,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(payload?.error || 'Unable to submit issue right now. Please try again later.')
      } else {
        if (payload && typeof (payload as any).message === 'string') {
          setMessage((payload as any).message)
        } else {
          setMessage('Thanks for letting us know — the transparency team will review within 5 business days.')
        }
        setTimeout(() => {
          closeDialog()
        }, 2000)
      }
    } catch (err) {
      setError('Unexpected error submitting report. Please try again later.')
    } finally {
      setSubmitting(false)
    }
  }

  const issueTypeLabel = useMemo(() => ISSUE_OPTIONS.find((option) => option.value === issueType)?.label, [issueType])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="report-issue-title">
      <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-[hsl(var(--bg-2))] shadow-xl">
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 id="report-issue-title" className="text-lg font-semibold text-[color:hsl(var(--text-1))]">
              Report data concern
            </h2>
            <p className="text-xs text-[color:hsl(var(--text-3))]">
              Describe what looks inaccurate or out of date so we can investigate quickly.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-full border border-border/60 p-1 text-[color:hsl(var(--text-3))] transition-colors hover:text-[color:hsl(var(--text-1))]"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label htmlFor="issue-type" className="text-sm font-medium text-[color:hsl(var(--text-2))]">
              Issue type
            </label>
            <select
              id="issue-type"
              value={issueType}
              onChange={(event) => setIssueType(event.target.value as typeof issueType)}
              className="w-full rounded-lg border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-2 text-sm text-[color:hsl(var(--text-1))] focus:border-[rgba(110,168,254,0.6)] focus:outline-none"
            >
              {ISSUE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="issue-details" className="text-sm font-medium text-[color:hsl(var(--text-2))]">
              What needs attention? <span className="text-[color:hsl(var(--neg))]">*</span>
            </label>
            <textarea
              id="issue-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={5}
              placeholder={`Example: The ${issueTypeLabel?.toLowerCase()} for this judge looks outdated compared to official court records.`}
              className="w-full rounded-lg border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-2 text-sm text-[color:hsl(var(--text-1))] focus:border-[rgba(110,168,254,0.6)] focus:outline-none"
              required
            />
            <p className="text-xs text-[color:hsl(var(--text-3))]">Provide links or context where possible. Minimum 10 characters.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="issue-email" className="text-sm font-medium text-[color:hsl(var(--text-2))]">
              Contact email (optional)
            </label>
            <input
              id="issue-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-lg border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-2 text-sm text-[color:hsl(var(--text-1))] focus:border-[rgba(110,168,254,0.6)] focus:outline-none"
              autoComplete="email"
            />
            <p className="text-xs text-[color:hsl(var(--text-3))]">We only use this to follow up if needed.</p>
          </div>

          {error && <div className="rounded-lg border border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.15)] px-3 py-2 text-xs text-[color:hsl(var(--neg))]">{error}</div>}
          {message && <div className="rounded-lg border border-[rgba(103,232,169,0.35)] bg-[rgba(103,232,169,0.14)] px-3 py-2 text-xs text-[color:hsl(var(--pos))]">{message}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-[color:hsl(var(--text-2))] transition-colors hover:text-[color:hsl(var(--text-1))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(110,168,254,0.5)] bg-[rgba(110,168,254,0.18)] px-4 py-2 text-sm font-semibold text-[color:hsl(var(--accent))] transition-colors disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[rgba(110,168,254,0.24)]"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Sending…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
