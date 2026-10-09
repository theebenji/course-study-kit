# Quiz spec

Every quiz `/quiz` gives follows these rules. Questions are generated fresh from the
lesson pages on each attempt and are never committed to the repo.

## Source material

- Fetch **every** lesson in the section from its URL before writing questions.
- Questions test what the course teaches, not general knowledge. If a lesson can't be
  fetched (paywall, login, dead link), stop and say which one. Don't fill the gap from memory.
- Read the section's notes file first. Every item under **Questions / confusions** must be
  covered by at least one question. Notes never make a quiz easier.

## Shape: 8 questions, 1 point each

| # | Type | Count | Tests |
|---|---|---|---|
| 1–5 | Multiple choice (A–D, one correct) | 5 | Recall of key concepts and terms |
| 6–7 | Short answer (1–3 sentences) | 2 | "Why" and "when would you…" |
| 8 | Applied scenario | 1 | Choosing and justifying an approach in a realistic situation |

- Spread questions across all lessons in the section; no lesson gets zero.
- Multiple-choice distractors should be plausible, not jokes.
- Ask all 8 in one message, then wait for answers.

## Grading

- Multiple choice: 1 or 0.
- Short answer and scenario: 1 (correct and complete), 0.5 (partly right or missing the key
  reason), or 0.
- For each question: the score, the correct answer, a one-to-two sentence explanation, and
  a link to the lesson that covers it.
- **Pass bar: 75%** (6 of 8).

## Re-quiz

- Below 75%: one new question per missed or half-credit question, aimed at the same concept
  from a different angle. Never repeat a question word for word.
- Re-quizzes are graded with the same rules and the same 75% bar.
- Repeat re-quizzes until the section passes. Each one is recorded as its own attempt.

## Timing

About 15–20 minutes per quiz including grading, plus about 5 per re-quiz.
