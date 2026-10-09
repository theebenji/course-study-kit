import { CopyCommand } from '../components/CopyCommand.tsx'
import { LessonRow } from '../components/LessonRow.tsx'
import { NotesEditor } from '../components/NotesEditor.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { formatDate, percent } from '../derive.ts'
import { href } from '../router.ts'
import { sectionStatus } from '../shared/schedule.ts'
import type { CourseBundle } from '../shared/schemas.ts'

export function SectionScreen({ bundle, sectionId }: { bundle: CourseBundle; sectionId: string }) {
  const { course, progress } = bundle
  const section = course.sections.find((s) => s.id === sectionId)
  if (!section) return <main className="card">No section “{sectionId}” in this course.</main>

  const attempts = bundle.attempts[section.id] ?? []
  const status = sectionStatus(attempts)
  const dayOf = (lessonId: string) => progress.schedule.find((d) => d.lessons.includes(lessonId))?.date

  return (
    <main className="section-screen">
      <header className="page-header">
        <h1>{section.title}</h1>
        <StatusBadge status={status} />
      </header>

      <div className="split">
        <div className="stack">
          <section className="card" aria-labelledby="lessons-heading">
            <h2 id="lessons-heading">Lessons</h2>
            <ul className="lessons">
              {section.lessons.map((l) => {
                const day = dayOf(l.id)
                return <LessonRow key={l.id} lesson={l} meta={day && formatDate(day)} />
              })}
            </ul>
          </section>

          <section className="card" aria-labelledby="practice-heading">
            <h2 id="practice-heading">Practice task</h2>
            <p>{section.practiceTask}</p>
            <p className="hint">Optional, not graded.</p>
          </section>

          <section className="card" aria-labelledby="quiz-heading">
            <h2 id="quiz-heading">Quiz</h2>
            {attempts.length > 0 && (
              <ol className="attempts">
                {attempts.map((a) => (
                  <li key={a.attempt}>
                    <a href={href.quiz(course.slug, section.id, a.attempt)}>
                      {a.kind === 'quiz' ? 'Quiz' : 'Re-quiz'} · {formatDate(a.takenAt)}
                    </a>
                    <span className="meta">
                      {a.score}/{a.total} ({percent(a.score, a.total)})
                    </span>
                    <span className="badge" data-status={a.passed ? 'passed' : 'needs-requiz'}>
                      {a.passed ? 'Pass' : 'Below 75%'}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {status !== 'passed' && (
              <CopyCommand
                command={`/quiz ${section.id}`}
                hint={status === 'needs-requiz' ? 'Runs a re-quiz on the concepts you missed.' : 'Run in Claude Code. About 15–20 minutes.'}
              />
            )}
          </section>
        </div>

        <NotesEditor slug={course.slug} sectionId={section.id} path={`my-progress/${course.slug}/notes/${section.id}.md`} />
      </div>
    </main>
  )
}
