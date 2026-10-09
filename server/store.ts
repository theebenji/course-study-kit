import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { z } from 'zod'
import {
  type Attempt,
  AttemptSchema,
  type Course,
  type CourseBundle,
  CourseSchema,
  type Progress,
  ProgressSchema,
  sectionIdPattern,
  slugPattern,
} from '../src/shared/schemas.ts'

// All personal data lives under one gitignored folder. Tests point PROGRESS_DIR
// at a committed fixture instead.
export const progressRoot = resolve(process.env.PROGRESS_DIR ?? 'my-progress')

export class NotFoundError extends Error {}
export class InvalidFileError extends Error {}

export function assertSlug(slug: string): void {
  if (!slugPattern.test(slug)) throw new NotFoundError(`Unknown course "${slug}"`)
}

export function assertSectionId(id: string): void {
  if (!sectionIdPattern.test(id)) throw new NotFoundError(`Unknown section "${id}"`)
}

export const paths = {
  course: (slug: string) => join(progressRoot, slug, 'course.json'),
  progress: (slug: string) => join(progressRoot, slug, 'progress.json'),
  notesDir: (slug: string) => join(progressRoot, slug, 'notes'),
  notes: (slug: string, sectionId: string) => join(progressRoot, slug, 'notes', `${sectionId}.md`),
  quizzesDir: (slug: string) => join(progressRoot, slug, 'quizzes'),
}

async function readJson<S extends z.ZodType>(file: string, schema: S): Promise<z.infer<S>> {
  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch {
    throw new NotFoundError(`Missing ${file}`)
  }
  const parsed = schema.safeParse(JSON.parse(raw))
  if (!parsed.success) {
    throw new InvalidFileError(`${file} is invalid:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`)
  }
  return parsed.data
}

export async function listCourses(): Promise<{ slug: string; title: string }[]> {
  let entries: string[]
  try {
    entries = await readdir(progressRoot)
  } catch {
    return []
  }
  const courses = []
  for (const slug of entries.sort()) {
    if (!slugPattern.test(slug)) continue
    try {
      const course = await readCourse(slug)
      await readProgress(slug)
      courses.push({ slug, title: course.title })
    } catch {
      // Half-initialised folder (e.g. /study-start still running): skip it.
    }
  }
  return courses
}

export function readCourse(slug: string): Promise<Course> {
  assertSlug(slug)
  return readJson(paths.course(slug), CourseSchema)
}

export function readProgress(slug: string): Promise<Progress> {
  assertSlug(slug)
  return readJson(paths.progress(slug), ProgressSchema)
}

export async function writeProgress(progress: Progress): Promise<void> {
  const valid = ProgressSchema.parse(progress)
  await writeFile(paths.progress(valid.courseSlug), `${JSON.stringify(valid, null, 2)}\n`)
}

export async function readAttempts(slug: string): Promise<Record<string, Attempt[]>> {
  assertSlug(slug)
  const result: Record<string, Attempt[]> = {}
  let sectionDirs: string[]
  try {
    sectionDirs = await readdir(paths.quizzesDir(slug))
  } catch {
    return result
  }
  for (const sectionId of sectionDirs) {
    if (!sectionIdPattern.test(sectionId)) continue
    const dir = join(paths.quizzesDir(slug), sectionId)
    const files = (await readdir(dir)).filter((f) => /^attempt-\d+\.json$/.test(f))
    const attempts = await Promise.all(files.map((f) => readJson(join(dir, f), AttemptSchema)))
    result[sectionId] = attempts.sort((a, b) => a.attempt - b.attempt)
  }
  return result
}

export function today(): string {
  if (process.env.STUDY_TODAY) return process.env.STUDY_TODAY
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export async function readBundle(slug: string): Promise<CourseBundle> {
  const [course, progress, attempts] = await Promise.all([readCourse(slug), readProgress(slug), readAttempts(slug)])
  return { course, progress, attempts, today: today() }
}

export async function readNotes(slug: string, sectionId: string): Promise<string> {
  assertSlug(slug)
  assertSectionId(sectionId)
  try {
    return await readFile(paths.notes(slug, sectionId), 'utf8')
  } catch {
    throw new NotFoundError(`No notes for ${sectionId}`)
  }
}

export async function writeNotes(slug: string, sectionId: string, text: string): Promise<void> {
  assertSlug(slug)
  assertSectionId(sectionId)
  const course = await readCourse(slug)
  if (!course.sections.some((s) => s.id === sectionId)) throw new NotFoundError(`Unknown section "${sectionId}"`)
  await mkdir(paths.notesDir(slug), { recursive: true })
  await writeFile(paths.notes(slug, sectionId), text)
}

export async function setLessonDone(slug: string, lessonId: string, done: boolean): Promise<Progress> {
  const [course, progress] = await Promise.all([readCourse(slug), readProgress(slug)])
  if (!course.sections.some((s) => s.lessons.some((l) => l.id === lessonId))) {
    throw new NotFoundError(`Unknown lesson "${lessonId}"`)
  }
  const completed = new Set(progress.completedLessons)
  if (done) completed.add(lessonId)
  else completed.delete(lessonId)
  const next = { ...progress, completedLessons: [...completed] }
  await writeProgress(next)
  return next
}
