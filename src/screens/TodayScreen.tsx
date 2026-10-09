import { CopyCommand } from '../components/CopyCommand.tsx'
import { LessonRow } from '../components/LessonRow.tsx'
import { Meter, StatusBadge } from '../components/StatusBadge.tsx'
import { formatDate, lessonIndex, todayView, totals } from '../derive.ts'
import { href } from '../router.ts'
import { sectionStatus } from '../shared/schedule.ts'
import type { CourseBundle } from '../shared/schemas.ts'

export function TodayScreen({ bundle }: { bundle: CourseBundle }) {
  const { course, progress, attempts, today } = bundle
  const index = lessonIndex(bundle)
  const view = todayView(bundle)
  const t = totals(bundle)
  const sectionTitle = (id: string) => course.sections.find((s) => s.id === id)?.title ?? id

  return (
    <main className="today">
      <section className="meters">
        <Meter label="Lessons read" value={t.lessonsDone} max={t.lessons} />
        <Meter label="Sections passed" value={t.passed} max={t.sections} />
      </section>

      {view.finished ? (
        <section className="card celebrate">
          <h2>Every section passed 🎉</h2>
          <p>
            <a href={href.certificate(course.slug)}>See your certificate</a>
          </p>
        </section>
      ) : (
        <section className="card" aria-labelledby="day-heading">
          <h2 id="day-heading">
            {view.day ? (view.isToday ? 'Today' : `Next study day`) : 'Schedule complete'}
            {view.day && <span className="sub">{formatDate(view.day.date, { weekday: 'long', month: 'long', day: 'numeric' })}</span>}
          </h2>
          {view.day ? (
            <ul className="lessons">
              {view.day.lessons.map((id) => {
                const entry = index.get(id)!
                return <LessonRow key={id} lesson={entry.lesson} meta={<a href={href.section(course.slug, entry.section.id)}>{entry.section.title}</a>} />
              })}
            </ul>
          ) : (
            <p>The scheduled days are over. Catch up on anything below at your own pace.</p>
          )}
          {view.quizzesDue.map((id) => (
            <div className="quiz-due" key={id}>
              <h3>Quiz: {sectionTitle(id)}</h3>
              <CopyCommand command={`/quiz ${id}`} hint="Run in Claude Code when you've finished the section. About 15–20 minutes." />
            </div>
          ))}
        </section>
      )}

      {view.behind.length > 0 && (
        <section className="card behind" aria-labelledby="behind-heading">
          <h2 id="behind-heading">Catch up ({view.behind.length})</h2>
          <ul className="lessons">
            {view.behind.map((id) => {
              const entry = index.get(id)!
              return <LessonRow key={id} lesson={entry.lesson} meta={entry.section.title} />
            })}
          </ul>
        </section>
      )}

      <section className="card" aria-labelledby="sections-heading">
        <h2 id="sections-heading">Sections</h2>
        <ol className="section-list">
          {course.sections.map((s) => {
            const done = s.lessons.filter((l) => progress.completedLessons.includes(l.id)).length
            const quizDay = progress.schedule.find((d) => d.quizzes.includes(s.id))?.date
            return (
              <li key={s.id}>
                <a href={href.section(course.slug, s.id)}>{s.title}</a>
                <span className="meta">
                  {done}/{s.lessons.length} read{quizDay && ` · quiz ${formatDate(quizDay)}`}
                </span>
                <StatusBadge status={sectionStatus(attempts[s.id])} />
              </li>
            )
          })}
        </ol>
      </section>

      <details className="card schedule">
        <summary>Full schedule</summary>
        <ol>
          {progress.schedule.map((d) => (
            <li key={d.date} data-today={d.date === today} data-past={d.date < today}>
              <span className="date">{formatDate(d.date)}</span>
              <span>{d.lessons.map((id) => index.get(id)?.lesson.title).join(' · ')}</span>
              {d.quizzes.length > 0 && <strong className="quiz-tag">Quiz: {d.quizzes.map(sectionTitle).join(', ')}</strong>}
            </li>
          ))}
        </ol>
      </details>
    </main>
  )
}
