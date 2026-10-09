import { buildSchedule, nextMonday, sectionStatus, weekdaysFrom } from './schedule.ts'
import type { Attempt, Course } from './schemas.ts'

function course(sizes: number[]): Course {
  let n = 0
  return {
    slug: 'c',
    title: 'C',
    url: 'https://example.com',
    sections: sizes.map((size, i) => ({
      id: `0${i + 1}-s${i + 1}`,
      title: `S${i + 1}`,
      practiceTask: 'x',
      lessons: Array.from({ length: size }, () => ({ id: `l${++n}`, title: `L${n}`, url: 'https://example.com' })),
    })),
  }
}

describe('weekdaysFrom', () => {
  it('skips weekends', () => {
    // 2026-10-09 is a Friday
    expect(weekdaysFrom('2026-10-09', 3)).toEqual(['2026-10-09', '2026-10-12', '2026-10-13'])
  })
})

describe('nextMonday', () => {
  it('returns the following Monday, even from a Monday', () => {
    expect(nextMonday('2026-10-09')).toBe('2026-10-12')
    expect(nextMonday('2026-10-12')).toBe('2026-10-19')
  })
})

describe('buildSchedule', () => {
  // The shape of AI Development Setup: 37 lessons in 8 sections.
  const c = course([6, 2, 3, 3, 3, 6, 9, 5])
  const schedule = buildSchedule(c, '2026-10-12', 10)

  it('covers every lesson exactly once, in order', () => {
    expect(schedule.flatMap((d) => d.lessons)).toEqual(c.sections.flatMap((s) => s.lessons.map((l) => l.id)))
  })

  it('keeps the daily load within one lesson of even', () => {
    const sizes = schedule.map((d) => d.lessons.length)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
  })

  it('runs two weeks of weekdays', () => {
    expect(schedule[0].date).toBe('2026-10-12')
    expect(schedule.at(-1)!.date).toBe('2026-10-23')
  })

  it("puts each quiz on the day of the section's last lesson", () => {
    for (const section of c.sections) {
      const day = schedule.find((d) => d.quizzes.includes(section.id))!
      expect(day.lessons).toContain(section.lessons.at(-1)!.id)
    }
    expect(schedule.flatMap((d) => d.quizzes)).toHaveLength(8)
  })
})

describe('sectionStatus', () => {
  const attempt = (passed: boolean) => ({ passed }) as Attempt
  it('tracks not-started, re-quiz and passed', () => {
    expect(sectionStatus(undefined)).toBe('not-started')
    expect(sectionStatus([attempt(false)])).toBe('needs-requiz')
    expect(sectionStatus([attempt(false), attempt(true)])).toBe('passed')
  })
})
