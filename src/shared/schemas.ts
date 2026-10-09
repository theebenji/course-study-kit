import { z } from 'zod'

// File formats under my-progress/<course-slug>/. The Claude Code skills write these
// files and the dashboard reads them; `npm run check-progress` validates against
// these schemas so the two can't drift apart.

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const sectionIdPattern = /^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/
const isoDate = z.iso.date()

export const LessonSchema = z.object({
  id: z.string().regex(slugPattern),
  title: z.string().min(1),
  url: z.url(),
})

export const SectionSchema = z.object({
  /** Two-digit order prefix plus a slug, e.g. "01-foundations". One quiz per section. */
  id: z.string().regex(sectionIdPattern),
  title: z.string().min(1),
  practiceTask: z.string().min(1),
  lessons: z.array(LessonSchema).min(1),
})

/** my-progress/<slug>/course.json */
export const CourseSchema = z
  .object({
    slug: z.string().regex(slugPattern),
    title: z.string().min(1),
    url: z.url(),
    sections: z.array(SectionSchema).min(1),
  })
  .superRefine((course, ctx) => {
    const seen = new Set<string>()
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (seen.has(lesson.id)) {
          ctx.addIssue({ code: 'custom', message: `Duplicate lesson id "${lesson.id}"` })
        }
        seen.add(lesson.id)
      }
    }
  })

export const ScheduleDaySchema = z.object({
  date: isoDate,
  lessons: z.array(z.string()),
  /** Section ids whose quiz falls on this day. */
  quizzes: z.array(z.string()),
})

/** my-progress/<slug>/progress.json */
export const ProgressSchema = z.object({
  courseSlug: z.string().regex(slugPattern),
  student: z.string().min(1),
  startDate: isoDate,
  endDate: isoDate,
  schedule: z.array(ScheduleDaySchema).min(1),
  completedLessons: z.array(z.string()),
  certificate: z.object({ issuedAt: isoDate }).optional(),
})

export const QuestionTypeSchema = z.enum(['multiple-choice', 'short-answer', 'scenario'])

export const QuestionSchema = z
  .object({
    number: z.int().positive(),
    type: QuestionTypeSchema,
    lessonId: z.string(),
    prompt: z.string().min(1),
    /** Exactly four options for multiple choice, labelled A–D in order. */
    choices: z.array(z.string()).length(4).optional(),
    /** A letter A–D for multiple choice; a model answer otherwise. */
    correctAnswer: z.string().min(1),
    /** What the student wrote, verbatim (a letter for multiple choice). */
    yourAnswer: z.string(),
    score: z.union([z.literal(0), z.literal(0.5), z.literal(1)]),
    explanation: z.string().min(1),
  })
  .refine((q) => (q.type === 'multiple-choice') === (q.choices !== undefined), {
    message: 'Multiple-choice questions need four choices; other types have none',
  })
  .refine((q) => q.type !== 'multiple-choice' || q.score !== 0.5, {
    message: 'Multiple-choice questions score 0 or 1',
  })
  .refine((q) => q.type !== 'multiple-choice' || /^[A-D]$/.test(q.correctAnswer), {
    message: 'Multiple-choice correctAnswer is a single letter A–D',
  })

/** my-progress/<slug>/quizzes/<section-id>/attempt-NN.json */
export const AttemptSchema = z
  .object({
    sectionId: z.string().regex(sectionIdPattern),
    attempt: z.int().positive(),
    kind: z.enum(['quiz', 'requiz']),
    takenAt: isoDate,
    questions: z.array(QuestionSchema).min(1),
    score: z.number().nonnegative(),
    total: z.int().positive(),
    passed: z.boolean(),
  })
  .superRefine((a, ctx) => {
    const sum = a.questions.reduce((acc, q) => acc + q.score, 0)
    if (sum !== a.score) {
      ctx.addIssue({ code: 'custom', message: `score is ${a.score} but questions sum to ${sum}` })
    }
    if (a.total !== a.questions.length) {
      ctx.addIssue({ code: 'custom', message: `total is ${a.total} but there are ${a.questions.length} questions` })
    }
    if (a.passed !== isPassing(a.score, a.total)) {
      ctx.addIssue({ code: 'custom', message: `passed should be ${!a.passed} for ${a.score}/${a.total}` })
    }
  })

export const PASS_BAR = 0.75

export function isPassing(score: number, total: number): boolean {
  return score / total >= PASS_BAR
}

export type Lesson = z.infer<typeof LessonSchema>
export type Section = z.infer<typeof SectionSchema>
export type Course = z.infer<typeof CourseSchema>
export type ScheduleDay = z.infer<typeof ScheduleDaySchema>
export type Progress = z.infer<typeof ProgressSchema>
export type Question = z.infer<typeof QuestionSchema>
export type Attempt = z.infer<typeof AttemptSchema>

/** What the server returns for one course: everything the dashboard needs. */
export interface CourseBundle {
  course: Course
  progress: Progress
  /** Attempts per section id, oldest first. */
  attempts: Record<string, Attempt[]>
  /** The server's idea of today (YYYY-MM-DD), overridable for tests. */
  today: string
}
