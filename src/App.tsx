import { useEffect } from 'react'
import { href, useRoute } from './router.ts'
import { CertificateScreen } from './screens/CertificateScreen.tsx'
import { QuizScreen } from './screens/QuizScreen.tsx'
import { SectionScreen } from './screens/SectionScreen.tsx'
import { StartScreen } from './screens/StartScreen.tsx'
import { TodayScreen } from './screens/TodayScreen.tsx'
import { useStudy } from './store/useStudy.ts'

export default function App() {
  const route = useRoute()
  const { courses, bundle, error, loadCourses, loadBundle } = useStudy()
  const slug = route.name === 'home' ? null : route.slug

  useEffect(() => {
    void loadCourses()
  }, [loadCourses])

  useEffect(() => {
    if (slug) void loadBundle(slug)
  }, [slug, loadBundle])

  // Claude Code writes files while this tab is in the background; refetch on return.
  useEffect(() => {
    const refresh = () => {
      void loadCourses()
      if (slug) void loadBundle(slug)
    }
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [slug, loadCourses, loadBundle])

  // With exactly one course, skip the picker.
  useEffect(() => {
    if (route.name === 'home' && courses?.length === 1) window.location.replace(href.today(courses[0].slug))
  }, [route.name, courses])

  const current = bundle && slug === bundle.course.slug ? bundle : null

  return (
    <>
      <header className="app-header no-print">
        <a className="brand" href={href.home()}>
          Course Study Kit
        </a>
        {current && (
          <nav aria-label="Course">
            <a href={href.today(current.course.slug)} aria-current={route.name === 'today' ? 'page' : undefined}>
              {current.course.title}
            </a>
            <a href={href.certificate(current.course.slug)} aria-current={route.name === 'certificate' ? 'page' : undefined}>
              Certificate
            </a>
          </nav>
        )}
      </header>

      {error && (
        <div className="error no-print" role="alert">
          {error}
        </div>
      )}

      {route.name === 'home' ? (
        courses ? <StartScreen courses={courses} /> : <p className="loading">Loading…</p>
      ) : !current ? (
        !error && <p className="loading">Loading…</p>
      ) : route.name === 'today' ? (
        <TodayScreen bundle={current} />
      ) : route.name === 'section' ? (
        <SectionScreen key={route.sectionId} bundle={current} sectionId={route.sectionId} />
      ) : route.name === 'quiz' ? (
        <QuizScreen bundle={current} sectionId={route.sectionId} attempt={route.attempt} />
      ) : (
        <CertificateScreen bundle={current} />
      )}
    </>
  )
}
