import type { CourseBundle, Progress } from './shared/schemas.ts'

export interface CourseSummary {
  slug: string
  title: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `${res.status} ${res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : (res.text() as Promise<T>)
}

export const api = {
  courses: () => request<CourseSummary[]>('/courses'),
  bundle: (slug: string) => request<CourseBundle>(`/courses/${slug}`),
  setLessonDone: (slug: string, lessonId: string, done: boolean) =>
    request<Progress>(`/courses/${slug}/lessons/${lessonId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ done }),
    }),
  notes: (slug: string, sectionId: string) => request<string>(`/courses/${slug}/notes/${sectionId}`),
  saveNotes: (slug: string, sectionId: string, text: string) =>
    request<void>(`/courses/${slug}/notes/${sectionId}`, {
      method: 'PUT',
      headers: { 'content-type': 'text/markdown' },
      body: text,
    }),
}
