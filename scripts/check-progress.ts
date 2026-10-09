// Validate everything under my-progress/ (or PROGRESS_DIR) against src/shared/schemas.ts.
// Every skill runs this after writing files. Exits non-zero with a list of problems.
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { slugPattern } from '../src/shared/schemas.ts'
import { paths, progressRoot, readAttempts, readCourse, readProgress } from '../server/store.ts'

const problems: string[] = []
const check = async (fn: () => Promise<unknown>) => {
  try {
    await fn()
  } catch (err) {
    problems.push(err instanceof Error ? err.message : String(err))
  }
}

const slugs = existsSync(progressRoot) ? (await readdir(progressRoot)).filter((s) => slugPattern.test(s)) : []

for (const slug of slugs) {
  await check(async () => {
    const [course, progress, attempts] = await Promise.all([readCourse(slug), readProgress(slug), readAttempts(slug)])
    const lessonIds = new Set(course.sections.flatMap((s) => s.lessons.map((l) => l.id)))
    const sectionIds = new Set(course.sections.map((s) => s.id))

    if (progress.courseSlug !== course.slug || course.slug !== slug) {
      problems.push(`${slug}: folder, course.slug and progress.courseSlug must all match`)
    }
    for (const day of progress.schedule) {
      for (const id of day.lessons) if (!lessonIds.has(id)) problems.push(`${slug}: schedule ${day.date} has unknown lesson "${id}"`)
      for (const id of day.quizzes) if (!sectionIds.has(id)) problems.push(`${slug}: schedule ${day.date} has unknown section "${id}"`)
    }
    for (const id of progress.completedLessons) {
      if (!lessonIds.has(id)) problems.push(`${slug}: completedLessons has unknown lesson "${id}"`)
    }
    for (const section of course.sections) {
      if (!existsSync(paths.notes(slug, section.id))) problems.push(`${slug}: missing notes/${section.id}.md`)
    }
    for (const [sectionId, list] of Object.entries(attempts)) {
      if (!sectionIds.has(sectionId)) problems.push(`${slug}: quizzes/${sectionId} is not a section`)
      list.forEach((a, i) => {
        if (a.sectionId !== sectionId) problems.push(`${slug}: quizzes/${sectionId}/attempt-${a.attempt} has sectionId "${a.sectionId}"`)
        if (a.attempt !== i + 1) problems.push(`${slug}: quizzes/${sectionId} attempts should be numbered 1, 2, 3… (found ${a.attempt} at position ${i + 1})`)
        if ((i === 0) !== (a.kind === 'quiz')) problems.push(`${slug}: quizzes/${sectionId}/attempt-${a.attempt} should be kind "${i === 0 ? 'quiz' : 'requiz'}"`)
        for (const q of a.questions) {
          if (!lessonIds.has(q.lessonId)) problems.push(`${slug}: quizzes/${sectionId}/attempt-${a.attempt} Q${q.number} has unknown lesson "${q.lessonId}"`)
        }
      })
    }
    if (progress.certificate) {
      const unpassed = course.sections.filter((s) => !attempts[s.id]?.some((a) => a.passed))
      if (unpassed.length) problems.push(`${slug}: certificate issued but not passed: ${unpassed.map((s) => s.id).join(', ')}`)
    }
  })
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s) in ${progressRoot}:\n`)
  for (const p of problems) console.error(`- ${p}`)
  process.exit(1)
}
console.log(`✓ ${slugs.length} course(s) in ${progressRoot} are valid`)
