import { useSyncExternalStore } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'today'; slug: string }
  | { name: 'section'; slug: string; sectionId: string }
  | { name: 'quiz'; slug: string; sectionId: string; attempt: number | null }
  | { name: 'certificate'; slug: string }

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  const [slug, page, id, attempt] = parts
  if (!slug) return { name: 'home' }
  if (page === 'section' && id) return { name: 'section', slug, sectionId: id }
  if (page === 'quiz' && id) return { name: 'quiz', slug, sectionId: id, attempt: attempt ? Number(attempt) : null }
  if (page === 'certificate') return { name: 'certificate', slug }
  return { name: 'today', slug }
}

export const href = {
  home: () => '#/',
  today: (slug: string) => `#/${slug}`,
  section: (slug: string, sectionId: string) => `#/${slug}/section/${sectionId}`,
  quiz: (slug: string, sectionId: string, attempt?: number) =>
    `#/${slug}/quiz/${sectionId}${attempt ? `/${attempt}` : ''}`,
  certificate: (slug: string) => `#/${slug}/certificate`,
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parseRoute(hash)
}
