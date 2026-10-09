// Turn a course.json written by /study-start into a dated schedule and notes files.
//
//   npm run study:init -- <course-slug> [--start YYYY-MM-DD] [--weekdays 10] [--student "Name"] [--force]
//
// --start defaults to the next Monday; --weekdays defaults to 10 (two weeks).
// Existing notes files are never overwritten. --force replaces an existing progress.json.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { userInfo } from 'node:os'
import { parseArgs } from 'node:util'
import { buildSchedule, nextMonday } from '../src/shared/schedule.ts'
import type { Progress } from '../src/shared/schemas.ts'
import { paths, readCourse, today, writeProgress } from '../server/store.ts'
import { renderNotes } from './notes-template.ts'

function defaultStudent(): string {
  try {
    const name = execFileSync('git', ['config', 'user.name'], { encoding: 'utf8' }).trim()
    if (name) return name
  } catch {
    // No git identity configured.
  }
  return userInfo().username
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    start: { type: 'string' },
    weekdays: { type: 'string', default: '10' },
    student: { type: 'string' },
    force: { type: 'boolean', default: false },
  },
})

const slug = positionals[0]
if (!slug) {
  console.error('Usage: npm run study:init -- <course-slug> [--start YYYY-MM-DD] [--weekdays 10] [--student "Name"] [--force]')
  process.exit(1)
}

const course = await readCourse(slug)
if (existsSync(paths.progress(slug)) && !values.force) {
  console.error(`${paths.progress(slug)} already exists. Pass --force to rebuild the schedule (completed lessons are kept).`)
  process.exit(1)
}

const start = values.start ?? nextMonday(today())
const weekdays = Number(values.weekdays)
if (!Number.isInteger(weekdays) || weekdays < 1) {
  console.error('--weekdays must be a positive whole number')
  process.exit(1)
}

const schedule = buildSchedule(course, start, weekdays)
const previous: Progress | undefined = existsSync(paths.progress(slug))
  ? JSON.parse(await readFile(paths.progress(slug), 'utf8'))
  : undefined

await writeProgress({
  courseSlug: slug,
  student: values.student ?? previous?.student ?? defaultStudent(),
  startDate: schedule[0].date,
  endDate: schedule.at(-1)!.date,
  schedule,
  completedLessons: previous?.completedLessons ?? [],
})

const template = await readFile(new URL('../templates/notes.md', import.meta.url), 'utf8')
await mkdir(paths.notesDir(slug), { recursive: true })
const created: string[] = []
for (const section of course.sections) {
  const file = paths.notes(slug, section.id)
  if (existsSync(file)) continue
  await writeFile(file, renderNotes(template, course, section, schedule))
  created.push(section.id)
}

const titleOf = new Map(course.sections.flatMap((s) => s.lessons.map((l) => [l.id, l.title])))
const sectionTitle = new Map(course.sections.map((s) => [s.id, s.title]))
console.log(`\n${course.title}: ${schedule[0].date} → ${schedule.at(-1)!.date}\n`)
for (const day of schedule) {
  const quiz = day.quizzes.length ? `  ★ quiz: ${day.quizzes.map((id) => sectionTitle.get(id)).join(', ')}` : ''
  console.log(`${day.date}  (${day.lessons.length})  ${day.lessons.map((id) => titleOf.get(id)).join(' · ')}${quiz}`)
}
console.log(`\nNotes created for: ${created.length ? created.join(', ') : 'none (all existed)'}`)
