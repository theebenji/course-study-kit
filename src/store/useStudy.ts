import { create } from 'zustand'
import { api, type CourseSummary } from '../api.ts'
import type { CourseBundle } from '../shared/schemas.ts'

interface StudyState {
  courses: CourseSummary[] | null
  bundle: CourseBundle | null
  error: string | null
  loadCourses: () => Promise<void>
  loadBundle: (slug: string) => Promise<void>
  toggleLesson: (lessonId: string, done: boolean) => Promise<void>
}

export const useStudy = create<StudyState>((set, get) => ({
  courses: null,
  bundle: null,
  error: null,

  loadCourses: async () => {
    try {
      set({ courses: await api.courses(), error: null })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  loadBundle: async (slug) => {
    try {
      set({ bundle: await api.bundle(slug), error: null })
    } catch (err) {
      set({ bundle: null, error: (err as Error).message })
    }
  },

  toggleLesson: async (lessonId, done) => {
    const bundle = get().bundle
    if (!bundle) return
    const completed = new Set(bundle.progress.completedLessons)
    if (done) completed.add(lessonId)
    else completed.delete(lessonId)
    // Optimistic: tick immediately, roll back if the write fails.
    set({ bundle: { ...bundle, progress: { ...bundle.progress, completedLessons: [...completed] } } })
    try {
      const progress = await api.setLessonDone(bundle.course.slug, lessonId, done)
      const current = get().bundle
      if (current) set({ bundle: { ...current, progress } })
    } catch (err) {
      set({ bundle, error: (err as Error).message })
    }
  },
}))
