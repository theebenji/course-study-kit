import { Hono } from 'hono'
import { z } from 'zod'
import {
  InvalidFileError,
  NotFoundError,
  listCourses,
  readBundle,
  readNotes,
  setLessonDone,
  writeNotes,
} from './store.ts'

// Local-only API over my-progress/. The dashboard never writes quizzes; those
// come from the Claude Code skills (see src/shared/quiz-engine.ts).
export const app = new Hono().basePath('/api')

app.onError((err, c) => {
  if (err instanceof NotFoundError) return c.json({ error: err.message }, 404)
  if (err instanceof InvalidFileError) return c.json({ error: err.message }, 422)
  console.error(err)
  return c.json({ error: 'Internal error' }, 500)
})

app.get('/health', (c) => c.json({ ok: true }))

app.get('/courses', async (c) => c.json(await listCourses()))

app.get('/courses/:slug', async (c) => c.json(await readBundle(c.req.param('slug'))))

const LessonDoneBody = z.object({ done: z.boolean() })

app.put('/courses/:slug/lessons/:lessonId', async (c) => {
  const body = LessonDoneBody.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Expected { "done": boolean }' }, 400)
  const progress = await setLessonDone(c.req.param('slug'), c.req.param('lessonId'), body.data.done)
  return c.json(progress)
})

app.get('/courses/:slug/notes/:sectionId', async (c) =>
  c.text(await readNotes(c.req.param('slug'), c.req.param('sectionId'))),
)

app.put('/courses/:slug/notes/:sectionId', async (c) => {
  await writeNotes(c.req.param('slug'), c.req.param('sectionId'), await c.req.text())
  return c.body(null, 204)
})
