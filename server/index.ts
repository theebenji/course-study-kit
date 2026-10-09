import { serve } from '@hono/node-server'
import { app } from './app.ts'
import { progressRoot } from './store.ts'

const port = Number(process.env.STUDY_SERVER_PORT ?? 5174)

// Bind to loopback only: this server reads and writes your personal files.
serve({ fetch: app.fetch, port, hostname: '127.0.0.1' }, () => {
  console.log(`study server on http://localhost:${port} (data: ${progressRoot})`)
})
