import { readFileSync } from 'node:fs'
import { todayView, totals } from './derive.ts'
import type { Attempt, CourseBundle } from './shared/schemas.ts'

const read = (p: string) => JSON.parse(readFileSync(`tests/fixtures/progress/demo-course/${p}`, 'utf8'))

function bundle(today: string, overrides: Partial<CourseBundle> = {}): CourseBundle {
  return {
    course: read('course.json'),
    progress: read('progress.json'),
    attempts: { '01-basics': [read('quizzes/01-basics/attempt-01.json'), read('quizzes/01-basics/attempt-02.json')] },
    today,
    ...overrides,
  }
}

describe('todayView', () => {
  it("shows today's lessons and hides quizzes already passed", () => {
    const v = todayView(bundle('2026-10-13'))
    expect(v.isToday).toBe(true)
    expect(v.day?.lessons).toEqual(['first-steps'])
    expect(v.behind).toEqual([])
    expect(v.quizzesDue).toEqual([])
  })

  it('lists unread lessons from earlier days as catch-up', () => {
    const b = bundle('2026-10-14')
    b.progress = { ...b.progress, completedLessons: ['intro'] }
    expect(todayView(b).behind).toEqual(['setup', 'first-steps'])
  })

  it('shows an untaken quiz as due on its day', () => {
    expect(todayView(bundle('2026-10-13', { attempts: {} })).quizzesDue).toEqual(['01-basics'])
  })

  it('jumps to the next study day over a weekend', () => {
    const v = todayView(bundle('2026-10-11'))
    expect(v.isToday).toBe(false)
    expect(v.day?.date).toBe('2026-10-12')
  })

  it('reports finished when every section has passed', () => {
    const pass = { passed: true } as Attempt
    expect(todayView(bundle('2026-10-14', { attempts: { '01-basics': [pass], '02-advanced': [pass] } })).finished).toBe(true)
  })
})

describe('totals', () => {
  it('counts lessons read and sections passed', () => {
    expect(totals(bundle('2026-10-13'))).toEqual({ lessons: 5, lessonsDone: 2, sections: 2, passed: 1 })
  })
})
