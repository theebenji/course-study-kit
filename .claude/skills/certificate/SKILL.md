---
name: certificate
description: Issue the completion certificate for a course once every section's quiz has passed. Stamps the issue date in progress.json; the dashboard renders the printable certificate. Use when the user runs /certificate or asks for their certificate.
argument-hint: [course slug]
---

# Certificate

1. Pick the course as `/study-today` does.
2. Check every section in `course.json` has a passing attempt in `quizzes/<section-id>/`. If any doesn't, list them with their `/quiz <section-id>` commands and stop.
3. Ask: "Name on the certificate: **<progress.student>**. Keep it or change it?" Wait for the answer.
4. In `progress.json`, set `student` if they changed it, and set `certificate` to `{ "issuedAt": "<date +%F>" }`. If it was already issued, keep the original date unless the user asks to reissue.
5. Run `npm run check-progress` and fix anything it reports until it passes.
6. Show a short summary: overall first-try score, overall passing score, and the strongest and weakest sections. Then tell the user to open the certificate with `npm run dev` at `http://localhost:5173/#/<slug>/certificate` and use **Print or save as PDF**.
