import { sectionStatus } from './shared/schedule.ts'
import type { CourseBundle, Lesson, ScheduleDay, Section } from './shared/schemas.ts'

// Pure views over a CourseBundle, kept out of components so they're easy to test.

export function lessonIndex(bundle: CourseBundle): Map<string, { lesson: Lesson; section: Section }> {
  return new Map(bundle.course.sections.flatMap((section) => section.lessons.map((lesson) => [lesson.id, { lesson, section }])))
}

export interface TodayView {
  /** The schedule day to show: today, or the next study day if today has none. */
  day: ScheduleDay | null
  isToday: boolean
  /** Lessons scheduled before `day` that aren't done yet. */
  behind: string[]
  /** Quizzes scheduled on or before `day` whose section hasn't passed. */
  quizzesDue: string[]
  finished: boolean
}

export function todayView(bundle: CourseBundle): TodayView {
  const { progress, today, attempts } = bundle
  const done = new Set(progress.completedLessons)
  const day = progress.schedule.find((d) => d.date >= today) ?? null
  const cutoff = day?.date ?? '9999-12-31'
  const earlier = progress.schedule.filter((d) => d.date < cutoff)
  const upTo = progress.schedule.filter((d) => d.date <= cutoff)
  const quizzesDue = upTo.flatMap((d) => d.quizzes).filter((id) => sectionStatus(attempts[id]) !== 'passed')
  return {
    day,
    isToday: day?.date === today,
    behind: earlier.flatMap((d) => d.lessons).filter((id) => !done.has(id)),
    quizzesDue,
    finished: bundle.course.sections.every((s) => sectionStatus(attempts[s.id]) === 'passed'),
  }
}

export function totals(bundle: CourseBundle) {
  const lessons = bundle.course.sections.reduce((n, s) => n + s.lessons.length, 0)
  const passed = bundle.course.sections.filter((s) => sectionStatus(bundle.attempts[s.id]) === 'passed').length
  const done = new Set(bundle.progress.completedLessons)
  const lessonsDone = bundle.course.sections.reduce((n, s) => n + s.lessons.filter((l) => done.has(l.id)).length, 0)
  return { lessons, lessonsDone, sections: bundle.course.sections.length, passed }
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, opts)
}

export function percent(score: number, total: number): string {
  return `${Math.round((score / total) * 100)}%`
}
