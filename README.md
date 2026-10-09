# Course Study Kit

Turn any online course into a dated study plan with section quizzes, notes and a
completion certificate. [Claude Code](https://claude.com/claude-code) skills do the
thinking: reading the outline, writing quizzes from the actual lessons, grading. A local
dashboard shows your schedule and progress, edits your notes, and shows your quiz history.

Everything personal (schedule, notes, answers, scores, certificate) lives in
`my-progress/`, which is gitignored. The repo itself holds only the structure.

## Quick start

```bash
npm install
npm run dev          # dashboard at http://localhost:5173
```

Then, in Claude Code in this folder:

```
/study-start https://stevekinney.com/courses/ai-development-setup 2 weeks
```

## How it works

| Step | Where | What happens |
|---|---|---|
| `/study-start <url> [duration]` | Claude Code | Reads the outline and confirms it with you. Writes `course.json`, a weekday schedule (default: 2 weeks from next Monday), and one notes file per section. |
| Daily reading | Dashboard | Today's lessons, catch-up list, progress meters. Tick lessons off as you read. |
| Notes | Dashboard or any editor | One Markdown file per section with Key ideas / Questions / Try this for each lesson, plus an optional practice task. **Anything under Questions / confusions is guaranteed to be quizzed.** |
| `/quiz <section-id>` | Claude Code | 8 fresh questions from the real lesson pages (5 multiple choice, 2 short answer, 1 scenario), graded with explanations. Below 75% you get a re-quiz on the misses until you pass. Each attempt is saved and shows up in the dashboard. |
| `/study-today` | Claude Code | The same "what's next" summary in chat; also marks lessons done. |
| `/certificate` | Claude Code → Dashboard | Once every section passes, stamps the date. The dashboard renders a printable certificate with each section's first-try and passing scores. |

A quiz takes about 15–20 minutes; a re-quiz about 5. The full rules are in
[`templates/quiz-spec.md`](templates/quiz-spec.md).

## Layout

```
.claude/skills/        study-start, study-today, quiz, certificate
templates/             notes.md (per-section notes), quiz-spec.md (quiz rules)
src/shared/            Zod schemas for every file in my-progress/, scheduling, QuizEngine interface
src/                   React dashboard
server/                Hono API over my-progress/ (loopback only)
scripts/               study-init (schedule + notes), check-progress (validation)
tests/fixtures/        a tiny demo course used by the tests
my-progress/           your data, gitignored
  <course-slug>/
    course.json        sections → lessons
    progress.json      schedule, completed lessons, certificate
    notes/<section>.md
    quizzes/<section>/attempt-NN.json
```

The skills write files and the dashboard reads them. Both sides agree through the
schemas in `src/shared/schemas.ts`, and every skill runs `npm run check-progress`
after writing.

## Scripts

| Command | |
|---|---|
| `npm run dev` | API server and Vite together |
| `npm test` | Vitest unit and component tests |
| `npm run test:e2e` | Playwright against a copy of the fixture course |
| `npm run typecheck` / `npm run lint` | tsc / oxlint |
| `npm run check-progress` | Validate `my-progress/` |
| `npm run study:init -- <slug> [--start] [--weekdays] [--force]` | Rebuild a schedule (used by `/study-start`) |

Starting over: delete `my-progress/<course-slug>/` and run `/study-start` again.
Several courses can run at once; each gets its own folder.

## Future: in-app quizzes via the Claude API

Quizzes run in Claude Code today. [`src/shared/quiz-engine.ts`](src/shared/quiz-engine.ts)
defines the `QuizEngine` interface the `/quiz` skill follows. A server-side engine
could implement it by calling the Claude API (key in a gitignored `.env.local`) so
quizzes could be taken in the browser. Results would use the same `Attempt` files,
so the dashboard wouldn't change.
