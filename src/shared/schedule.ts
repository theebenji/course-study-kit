import type { Attempt, Course, ScheduleDay } from './schemas.ts'

/** The first `count` weekdays starting on or after `start` (YYYY-MM-DD). */
export function weekdaysFrom(start: string, count: number): string[] {
  const days: string[] = []
  const d = new Date(`${start}T00:00:00Z`)
  while (days.length < count) {
    const dow = d.getUTCDay()
    if (dow !== 0 && dow !== 6) days.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return days
}

/** The next Monday strictly after `from` (YYYY-MM-DD). */
export function nextMonday(from: string): string {
  const d = new Date(`${from}T00:00:00Z`)
  do d.setUTCDate(d.getUTCDate() + 1)
  while (d.getUTCDay() !== 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Spread lessons evenly across weekdays, in course order. Each day gets a
 * contiguous run; a section's quiz lands on the day its last lesson is read.
 */
export function buildSchedule(course: Course, start: string, weekdays: number): ScheduleDay[] {
  const lessons = course.sections.flatMap((s) => s.lessons.map((l) => l.id))
  const lastLessonOf = new Map(course.sections.map((s) => [s.lessons.at(-1)!.id, s.id]))
  const days = weekdaysFrom(start, weekdays)

  let cursor = 0
  return days.map((date, i) => {
    // Cumulative target keeps the load even.
    const end = Math.round((lessons.length * (i + 1)) / days.length)
    const chunk = lessons.slice(cursor, end)
    cursor = end
    return {
      date,
      lessons: chunk,
      quizzes: chunk.flatMap((id) => lastLessonOf.get(id) ?? []),
    }
  })
}

export type SectionStatus = 'not-started' | 'needs-requiz' | 'passed'

export function sectionStatus(attempts: Attempt[] | undefined): SectionStatus {
  if (!attempts?.length) return 'not-started'
  return attempts.some((a) => a.passed) ? 'passed' : 'needs-requiz'
}
