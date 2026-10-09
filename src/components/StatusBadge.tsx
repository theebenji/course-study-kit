import type { SectionStatus } from '../shared/schedule.ts'

const labels: Record<SectionStatus, string> = {
  'not-started': 'Quiz not taken',
  'needs-requiz': 'Re-quiz needed',
  passed: 'Passed',
}

export function StatusBadge({ status }: { status: SectionStatus }) {
  return (
    <span className="badge" data-status={status}>
      {labels[status]}
    </span>
  )
}

export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div className="meter">
      <div className="meter-label">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <progress value={value} max={max} aria-label={label} />
    </div>
  )
}
