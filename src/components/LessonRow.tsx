import type { ReactNode } from 'react'
import type { Lesson } from '../shared/schemas.ts'
import { useStudy } from '../store/useStudy.ts'

export function LessonRow({ lesson, meta }: { lesson: Lesson; meta?: ReactNode }) {
  const done = useStudy((s) => s.bundle?.progress.completedLessons.includes(lesson.id) ?? false)
  const toggleLesson = useStudy((s) => s.toggleLesson)

  return (
    <li className="lesson-row" data-done={done}>
      <input
        type="checkbox"
        id={`lesson-${lesson.id}`}
        checked={done}
        onChange={(e) => toggleLesson(lesson.id, e.target.checked)}
        aria-label={`Mark "${lesson.title}" as read`}
      />
      <a href={lesson.url} target="_blank" rel="noreferrer">
        {lesson.title}
      </a>
      {meta && <span className="meta">{meta}</span>}
    </li>
  )
}
