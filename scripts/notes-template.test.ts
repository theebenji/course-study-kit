import { readFileSync } from 'node:fs'
import { buildSchedule } from '../src/shared/schedule.ts'
import { CourseSchema } from '../src/shared/schemas.ts'
import { renderNotes } from './notes-template.ts'

const template = readFileSync('templates/notes.md', 'utf8')
const course = CourseSchema.parse(JSON.parse(readFileSync('tests/fixtures/progress/demo-course/course.json', 'utf8')))
const schedule = buildSchedule(course, '2026-10-12', 3)

describe('renderNotes', () => {
  const notes = renderNotes(template, course, course.sections[0], schedule)

  it('fills every placeholder', () => {
    expect(notes).not.toMatch(/\{\{/)
  })

  it('writes one block per lesson with its link and date', () => {
    expect(notes.match(/### Questions \/ confusions/g)).toHaveLength(3)
    expect(notes).toContain('## Setup\n\n[Read the lesson](https://example.com/demo/setup) · Scheduled: 2026-10-12')
  })

  it('includes the quiz day, practice task and results area', () => {
    expect(notes).toMatch(/^# 1\. Basics/)
    expect(notes).toContain('Quiz day: 2026-10-13')
    expect(notes).toContain(course.sections[0].practiceTask)
    expect(notes).toContain('## Quiz results')
  })

  it('drops the template markers', () => {
    expect(notes).not.toContain('<!--')
  })
})
