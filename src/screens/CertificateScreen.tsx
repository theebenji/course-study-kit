import { CopyCommand } from '../components/CopyCommand.tsx'
import { formatDate, percent } from '../derive.ts'
import { href } from '../router.ts'
import { sectionStatus } from '../shared/schedule.ts'
import type { CourseBundle } from '../shared/schemas.ts'

const longDate = { year: 'numeric', month: 'long', day: 'numeric' } as const

export function CertificateScreen({ bundle }: { bundle: CourseBundle }) {
  const { course, progress, attempts } = bundle
  const remaining = course.sections.filter((s) => sectionStatus(attempts[s.id]) !== 'passed')

  if (remaining.length) {
    return (
      <main className="card locked">
        <h1>Certificate locked</h1>
        <p>Pass every section's quiz to unlock it. Still to go:</p>
        <ul>
          {remaining.map((s) => (
            <li key={s.id}>
              <a href={href.section(course.slug, s.id)}>{s.title}</a>
            </li>
          ))}
        </ul>
      </main>
    )
  }

  const rows = course.sections.map((s) => {
    const list = attempts[s.id]!
    const first = list[0]
    const passing = list.find((a) => a.passed)!
    return { section: s, first, passing }
  })
  const firstTry = rows.reduce((acc, r) => ({ score: acc.score + r.first.score, total: acc.total + r.first.total }), { score: 0, total: 0 })
  const finalScore = rows.reduce((acc, r) => ({ score: acc.score + r.passing.score, total: acc.total + r.passing.total }), { score: 0, total: 0 })

  return (
    <main className="certificate-screen">
      {!progress.certificate && (
        <section className="card no-print">
          <p>Every section is passed. Run this in Claude Code to issue the certificate and stamp the date:</p>
          <CopyCommand command="/certificate" />
        </section>
      )}
      {progress.certificate && (
        <div className="no-print actions">
          <button type="button" onClick={() => window.print()}>
            Print or save as PDF
          </button>
        </div>
      )}

      <article className="certificate" data-issued={!!progress.certificate}>
        <p className="eyebrow">Certificate of completion</p>
        <h1>{progress.student}</h1>
        <p>has completed</p>
        <h2>
          <a href={course.url}>{course.title}</a>
        </h2>
        <p className="dates">
          Studied {formatDate(progress.startDate, longDate)} – {formatDate(progress.endDate, longDate)}
        </p>

        <table>
          <thead>
            <tr>
              <th scope="col">Section</th>
              <th scope="col">First try</th>
              <th scope="col">Passed with</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.section.id}>
                <th scope="row">{r.section.title}</th>
                <td>{percent(r.first.score, r.first.total)}</td>
                <td>
                  {percent(r.passing.score, r.passing.total)}
                  {r.passing.kind === 'requiz' && <span className="meta"> (re-quiz)</span>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Overall</th>
              <td>{percent(firstTry.score, firstTry.total)}</td>
              <td>{percent(finalScore.score, finalScore.total)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="issued">
          {progress.certificate ? `Issued ${formatDate(progress.certificate.issuedAt, longDate)}` : 'Preview — not yet issued'}
        </p>
      </article>
    </main>
  )
}
