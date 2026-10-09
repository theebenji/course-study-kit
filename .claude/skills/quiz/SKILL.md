---
name: quiz
description: Quiz the user on one course section in chat. Writes fresh questions from the actual lesson pages and the user's notes, grades the answers, runs re-quizzes on misses, and records each attempt for the dashboard. Use when the user runs /quiz or asks to be quizzed on a section.
argument-hint: <section id or title> [course slug]
---

# Section quiz

This skill is the quiz engine today; it implements the contract in `src/shared/quiz-engine.ts`. Follow `templates/quiz-spec.md` exactly: it sets the question mix, grading and pass bar.

## 1. Find the section

- Pick the course as `/study-today` does: ask if there's more than one and the user didn't name it.
- Match the argument to a section `id` or title in `course.json`. If it's missing or ambiguous, list the sections with their status and ask.
- Read `quizzes/<section-id>/attempt-*.json` if it exists.
  - **No attempts:** this is the quiz (`kind: "quiz"`).
  - **Latest attempt failed:** this is a re-quiz (`kind: "requiz"`). Its focus is every question in the latest attempt that scored below 1.
  - **Already passed:** say so with the score and stop. Don't record extra attempts.
- If lessons in the section aren't in `completedLessons`, list them and ask whether to go ahead anyway.

## 2. Gather the material

1. Read `notes/<section-id>.md`. Collect every non-empty bullet under **Questions / confusions**; each must be covered by at least one question. Notes never make the quiz easier.
2. Fetch every lesson URL in the section (for a re-quiz, at least the lessons behind the missed questions). Pull out the concepts, terms, recommendations, examples and trade-offs each one teaches.
3. If any lesson can't be fetched, stop. Tell the user which lesson and why, and don't quiz from general knowledge.

## 3. Ask

Write the questions following the spec: 8 for a quiz, one per missed concept for a re-quiz, never repeating an earlier question word for word. Post them **all in one message**:

- Numbered, with the type in a short label: `**Q3** (multiple choice)`
- Multiple-choice options labelled A–D
- No hints, answers or lesson names that give the answer away
- End with: "Answer all of them in one reply, e.g. `1. B  2. D … 6. <your answer>`."

Then **stop and wait** for the user's reply. Don't grade, reveal or add anything until they answer.

## 4. Grade

Grade per the spec (multiple choice 0/1; short answer and scenario 0, 0.5 or 1). Reply with:

- One line per question: ✅ / 🟡 / ❌, the score, the correct answer when the score is below 1, a one-to-two sentence explanation, and the lesson link.
- The total, e.g. **6.5 / 8 (81%) — passed**, or how far below 75% it fell.

## 5. Record

Get the date with `date +%F`.

1. Write `my-progress/<slug>/quizzes/<section-id>/attempt-NN.json` (NN zero-padded: `01`, `02`, …) matching `AttemptSchema` in `src/shared/schemas.ts`:
   - `yourAnswer`: what the user wrote, verbatim (just the letter for multiple choice)
   - `correctAnswer`: the letter for multiple choice, a model answer otherwise
   - `score`, `total` and `passed`: consistent with the questions
2. Append to the end of the notes file, below `## Quiz results`, without touching anything else in it:
   ```markdown
   ### Quiz · 2026-10-13 · 6.5/8 (81%) ✅ passed
   Missed:
   - <concept> ([lesson title](url))
   ```
   Use "Re-quiz N" for re-quizzes and ❌ for below 75%. Leave out the "Missed" list when nothing was missed.
3. Run `npm run check-progress` and fix anything it reports until it passes.

## 6. Next

- **Passed:** congratulate the user briefly. Name the next section's first lesson or the next quiz due. If this was the last section, point to `/certificate`.
- **Below 75%:** list the concepts to review, with lesson links, and offer the re-quiz now ("say *go*") or later (`/quiz <section-id>`). Repeat re-quizzes until the section passes.
