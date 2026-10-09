// @vitest-environment node
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// The store resolves PROGRESS_DIR at import, so point it at a scratch copy first.
const dir = mkdtempSync(join(tmpdir(), 'study-kit-'))
cpSync('tests/fixtures/progress', dir, { recursive: true })
process.env.PROGRESS_DIR = dir
process.env.STUDY_TODAY = '2026-10-13'
const { app } = await import('./app.ts')

afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('API', () => {
  it('lists courses', async () => {
    const res = await app.request('/api/courses')
    expect(await res.json()).toEqual([{ slug: 'demo-course', title: 'Demo Course' }])
  })

  it('returns the bundle with attempts and the pinned date', async () => {
    const body = await (await app.request('/api/courses/demo-course')).json()
    expect(body.today).toBe('2026-10-13')
    expect(body.attempts['01-basics']).toHaveLength(2)
    expect(body.progress.completedLessons).toEqual(['intro', 'setup'])
  })

  it('marks lessons done and undone on disk', async () => {
    const put = (done: boolean) =>
      app.request('/api/courses/demo-course/lessons/first-steps', { method: 'PUT', body: JSON.stringify({ done }) })
    expect((await put(true)).status).toBe(200)
    const progress = () => JSON.parse(readFileSync(join(dir, 'demo-course/progress.json'), 'utf8'))
    expect(progress().completedLessons).toContain('first-steps')
    await put(false)
    expect(progress().completedLessons).not.toContain('first-steps')
  })

  it('reads and writes notes', async () => {
    const res = await app.request('/api/courses/demo-course/notes/01-basics', { method: 'PUT', body: '# mine' })
    expect(res.status).toBe(204)
    expect(await (await app.request('/api/courses/demo-course/notes/01-basics')).text()).toBe('# mine')
  })

  it('404s on unknown lessons, sections and path tricks', async () => {
    const unknownLesson = await app.request('/api/courses/demo-course/lessons/nope', { method: 'PUT', body: '{"done":true}' })
    expect(unknownLesson.status).toBe(404)
    expect((await app.request('/api/courses/demo-course/notes/99-nope', { method: 'PUT', body: 'x' })).status).toBe(404)
    expect((await app.request('/api/courses/..%2F..%2Fetc/notes/01-basics')).status).toBe(404)
  })

  it('400s on a bad body', async () => {
    const res = await app.request('/api/courses/demo-course/lessons/intro', { method: 'PUT', body: '{"done":"yes"}' })
    expect(res.status).toBe(400)
  })
})
