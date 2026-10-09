# Course Study Kit

- User-facing workflow lives in `.claude/skills/` (study-start, study-today, quiz, certificate). Quiz rules: `templates/quiz-spec.md`.
- Every file under `my-progress/` must match the schemas in `src/shared/schemas.ts`. Run `npm run check-progress` after writing any of them.
- `my-progress/` is personal data and gitignored. Never commit it, and never copy real progress into `tests/fixtures/`.
- Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`.
- Style: no semicolons, single quotes, `.ts` extensions on relative imports (server and scripts run under Node's `nodenext` resolution).
