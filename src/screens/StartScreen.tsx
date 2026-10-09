import { CopyCommand } from '../components/CopyCommand.tsx'
import type { CourseSummary } from '../api.ts'
import { href } from '../router.ts'

export function StartScreen({ courses }: { courses: CourseSummary[] }) {
  return (
    <main className="start">
      <h1>Course Study Kit</h1>
      {courses.length > 0 && (
        <section className="card">
          <h2>Your courses</h2>
          <ul className="course-list">
            {courses.map((c) => (
              <li key={c.slug}>
                <a href={href.today(c.slug)}>{c.title}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="card">
        <h2>{courses.length ? 'Start another course' : 'Start a course'}</h2>
        <p>
          Courses are set up by Claude Code, not this page. In Claude Code, open this repo and run the command below
          with the course's URL. It reads the outline, checks it with you, then writes the schedule and notes files
          this dashboard shows.
        </p>
        <CopyCommand
          command="/study-start <course URL> [duration]"
          hint="Duration is optional and defaults to 2 weeks of weekdays starting next Monday, e.g. “3 weeks” or “15 weekdays”."
        />
        <p className="hint">This page refreshes when you switch back to it.</p>
      </section>
    </main>
  )
}
