import { AttemptSchema, isPassing } from './schemas.ts'

const question = {
  number: 1,
  type: 'multiple-choice',
  lessonId: 'intro',
  prompt: 'Q?',
  choices: ['a', 'b', 'c', 'd'],
  correctAnswer: 'B',
  yourAnswer: 'B',
  score: 1,
  explanation: 'Because.',
} as const

const attempt = {
  sectionId: '01-basics',
  attempt: 1,
  kind: 'quiz',
  takenAt: '2026-10-13',
  questions: [question],
  score: 1,
  total: 1,
  passed: true,
}

describe('isPassing', () => {
  it('uses a 75% bar', () => {
    expect(isPassing(6, 8)).toBe(true)
    expect(isPassing(5.5, 8)).toBe(false)
  })
})

describe('AttemptSchema', () => {
  it('accepts a consistent attempt', () => {
    expect(AttemptSchema.safeParse(attempt).success).toBe(true)
  })

  it('rejects a score that does not match the questions', () => {
    expect(AttemptSchema.safeParse({ ...attempt, score: 0, passed: false }).success).toBe(false)
  })

  it('rejects a wrong passed flag', () => {
    expect(AttemptSchema.safeParse({ ...attempt, passed: false }).success).toBe(false)
  })

  it('requires a letter answer key for multiple choice', () => {
    const bad = { ...attempt, questions: [{ ...question, correctAnswer: 'b' }] }
    expect(AttemptSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects half credit on multiple choice', () => {
    const bad = { ...attempt, questions: [{ ...question, score: 0.5 }], score: 0.5, passed: false }
    expect(AttemptSchema.safeParse(bad).success).toBe(false)
  })
})
