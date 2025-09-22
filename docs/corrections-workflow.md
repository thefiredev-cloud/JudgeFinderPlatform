# Corrections Intake & Queue Workflow

## Overview

Public corrections filed through judge pages flow into the `profile_issues` table and surface in the admin dashboard. The workflow enforces severity-based SLAs, exposes overdue items, and tracks status transitions for auditability.

## Status Lifecycle

| Status | Purpose | Allowed Transitions |
| --- | --- | --- |
| `new` | Recently submitted; awaiting triage. | `researching`, `dismissed` |
| `researching` | Assigned for investigation. SLA clock continues until `resolved`. | `resolved`, `dismissed` |
| `resolved` | Issue verified and addressed. SLA stops. | `researching` *(if rollback required)* |
| `dismissed` | Invalid or duplicate report. | `researching` *(if reopened)* |

`last_status_change_at` captures the timestamp of each transition. A future automation can use it to compute time-in-state metrics.

## Severity Bands & SLAs

| Severity | Auto-assigned When | SLA Target | Priority Value |
| --- | --- | --- | --- |
| High | `assignment_change` issues | 2 business days | 90 |
| Medium | `bias_context`, `ads_or_policy` | 4 business days | 60 |
| Low | `data_accuracy`, `other` | 5 business days | 40 |

`sla_due_at` is computed during intake (`now + SLA days`). Records convert to “Overdue” in the dashboard once the timestamp passes and the status is not `resolved`/`dismissed`. `breached_at` is reserved for future automation when SLA violations are recorded server-side.

## Schema Additions

Migration `20251017_001_profile_issues_queue_extensions.sql` introduces:

- `severity` (`high` | `medium` | `low`)
- `priority` (integer sort key)
- `sla_due_at`, `breached_at`, `acknowledged_at`, `resolved_at`
- `last_status_change_at`
- `response_notes` (optional remediation notes)
- `meta` (JSONB payload for court IDs, attachments, etc.)

The admin intake view orders issues by priority first, then submission time, ensuring high-severity cases float to the top.

## Queue Management

- Dashboard exposes SLA badges, severity pills, and an overdue counter.
- Future enhancements: add filters (severity/status), acknowledgement actions that set `acknowledged_at`, and automation that populates `breached_at` when SLA is missed.

### Admin Dashboard Enhancements (2025 Q4)

- Bias analytics tab: The admin panel’s judge view now renders `<BiasPatternAnalysis>`, which charts case patterns, outcomes, temporal trends, and bias indicators pulled from `/api/judges/{id}/bias-analysis`.
- Court baseline visuals: When the API returns `court_baseline`, the dashboard displays a “Court average baseline” pill, sample size, and generated timestamp, highlighting Δ metrics against the judge’s values.
- Sample-size safeguards: Metrics with fewer than `NEXT_PUBLIC_MIN_SAMPLE_SIZE` recent decisions downgrade their quality badge and are hidden entirely if `NEXT_PUBLIC_HIDE_SAMPLE_BELOW_MIN` is true. The UI surfaces a dashed warning banner when sections are hidden.
- Series toggles: Analysts can toggle outcome and temporal series (case counts, settlement rates, duration) to focus on specific signals without refreshing the page.

## Intake API Preprocessing

`POST /api/report-profile-issue` now:

1. Validates issue type against the supported set.
2. Calculates severity, priority, `sla_due_at`, and `last_status_change_at`.
3. Stores metadata about submission channel and the provided court ID.
4. Enforces two-tier rate limiting (burst + daily) configurable via `CORRECTIONS_LIMIT_*` env vars.
5. Dispatches an optional webhook (`CORRECTIONS_WEBHOOK_URL`) for alerting.
6. Returns a severity-specific SLA promise to the reporter.

Defaults mirror the historical behaviour (5 requests per 5 minutes), but can now be tuned without code changes while the daily ceiling throttles chronic abuse.

### Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `CORRECTIONS_LIMIT_BURST` | `5` | Burst tokens for the short window limiter. |
| `CORRECTIONS_LIMIT_WINDOW` | `5 m` | Window duration for the burst limiter. |
| `CORRECTIONS_LIMIT_DAILY` | `20` | Daily tokens per IP/judge combination. |
| `CORRECTIONS_LIMIT_DAILY_WINDOW` | `1 d` | Window for the daily limiter. |
| `CORRECTIONS_WEBHOOK_URL` | — | Optional webhook endpoint notified on new intake. |
