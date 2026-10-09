import type { Course, ScheduleDay, Section } from '../src/shared/schemas.ts'

const LESSON_BLOCK = /<!-- Repeat this block once per lesson in the section -->\n([\s\S]*?)<!-- End of per-lesson block -->\n/

function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (match, key: string) => values[key] ?? match)
}

/** Render templates/notes.md for one section, expanding the per-lesson block. */
export function renderNotes(template: string, course: Course, section: Section, schedule: ScheduleDay[]): string {
  const dayOf = (lessonId: string) => schedule.find((d) => d.lessons.includes(lessonId))?.date ?? 'unscheduled'
  const quizDay = schedule.find((d) => d.quizzes.includes(section.id))?.date ?? 'unscheduled'

  const match = LESSON_BLOCK.exec(template)
  if (!match) throw new Error('templates/notes.md is missing its per-lesson block markers')
  const lessons = section.lessons
    .map((lesson) => fill(match[1], { LESSON_TITLE: lesson.title, LESSON_URL: lesson.url, LESSON_DATE: dayOf(lesson.id) }))
    .map((block) => block.trimEnd())
    .join('\n\n')

  return fill(template.replace(match[0], `${lessons}\n`), {
    SECTION_NUMBER: String(Number(section.id.slice(0, 2))),
    SECTION_TITLE: section.title,
    COURSE_TITLE: course.title,
    COURSE_URL: course.url,
    QUIZ_DATE: quizDay,
    PRACTICE_TASK: section.practiceTask,
  })
}
