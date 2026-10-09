import { CopyCommand } from '../components/CopyCommand.tsx'
import { formatDate, lessonIndex, percent } from '../derive.ts'
import { href } from '../router.ts'
import type { CourseBundle, Question } from '../shared/schemas.ts'

const typeLabel: Record<Question['type'], string> = {
  'multiple-choice': 'Multiple choice',
  'short-answer': 'Short answer',
  scenario: 'Scenario',
}

const letter = (i: number) => String.fromCharCode(65 + i)

/** Read-only view of graded attempts. Quizzes are taken in Claude Code with /quiz. */
export function QuizScreen({ bundle, sectionId, attempt }: { bundle: CourseBundle; sectionId: string; attempt: number | null }) {
  const { course } = bundle
  const section = course.sections.find((s) => s.id === sectionId)
  const attempts = bundle.attempts[sectionId] ?? []
  const shown = attempts.find((a) => a.attempt === attempt) ?? attempts.at(-1)
  const lessons = lessonIndex(bundle)

  if (!section) return <main className="card">No section “{sectionId}” in this course.</main>

  return (
    <main className="quiz-screen">
      <header className="page-header">
        <h1>
          <a href={href.section(course.slug, section.id)}>{section.title}</a> quiz
        </h1>
      </header>

      {attempts.length > 1 && (
        <nav className="tabs" aria-label="Attempts">
          {attempts.map((a) => (
            <a key={a.attempt} href={href.quiz(course.slug, section.id, a.attempt)} aria-current={a === shown ? 'page' : undefined}>
              {a.kind === 'quiz' ? 'Quiz' : `Re-quiz ${a.attempt - 1}`} · {percent(a.score, a.total)}
            </a>
          ))}
        </nav>
      )}

      {!shown ? (
        <section className="card">
          <p>No attempts yet.</p>
          <CopyCommand command={`/quiz ${section.id}`} hint="Run in Claude Code; results show up here." />
        </section>
      ) : (
        <>
          <section className="card score-card" data-passed={shown.passed}>
            <div className="big-score">{percent(shown.score, shown.total)}</div>
            <div>
              <strong>
                {shown.score} / {shown.total}
              </strong>{' '}
              · {shown.passed ? 'Passed' : 'Below the 75% bar'} · {formatDate(shown.takenAt)}
            </div>
            {!shown.passed && shown === attempts.at(-1) && <CopyCommand command={`/quiz ${section.id}`} hint="Starts a re-quiz on what you missed." />}
          </section>

          <ol className="questions">
            {shown.questions.map((q) => {
              const lesson = lessons.get(q.lessonId)?.lesson
              return (
                <li key={q.number} className="card question" data-score={q.score}>
                  <header>
                    <span className="q-type">
                      Q{q.number} · {typeLabel[q.type]}
                    </span>
                    <span className="q-score">{q.score} / 1</span>
                  </header>
                  <p className="prompt">{q.prompt}</p>
                  {q.choices && (
                    <ol className="choices" type="A">
                      {q.choices.map((c, i) => (
                        <li key={i} data-correct={q.correctAnswer === letter(i)} data-picked={q.yourAnswer.trim().toUpperCase().startsWith(letter(i))}>
                          {c}
                        </li>
                      ))}
                    </ol>
                  )}
                  <dl>
                    <dt>Your answer</dt>
                    <dd>{q.yourAnswer || <em>No answer</em>}</dd>
                    {q.score < 1 && (
                      <>
                        <dt>Correct answer</dt>
                        <dd>{q.correctAnswer}</dd>
                      </>
                    )}
                    <dt>Why</dt>
                    <dd>{q.explanation}</dd>
                  </dl>
                  {lesson && (
                    <a className="lesson-link" href={lesson.url} target="_blank" rel="noreferrer">
                      Lesson: {lesson.title}
                    </a>
                  )}
                </li>
              )
            })}
          </ol>
        </>
      )}
    </main>
  )
}
