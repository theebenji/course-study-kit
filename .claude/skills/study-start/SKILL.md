---
name: study-start
description: Set up a new course to study. Reads a course outline from a URL, confirms it with the user, then writes the course, a dated weekday schedule and per-section notes files under my-progress/. Use when the user runs /study-start or asks to start studying a course.
argument-hint: <course URL> [duration, e.g. "2 weeks" or "15 weekdays"] [start date]
---

# Start a course

Input: a course URL, plus an optional duration and start date. If no URL is given, ask for one and stop.

## 1. Read the outline

Fetch the URL and extract the **full** course outline: every top-level section and every lesson under it, in order, with absolute lesson URLs. If the page is a single lesson, find the course's table of contents (navigation, sidebar or index page) and use that. If you can't get a complete outline (login, paywall, script-only page), say so and stop. Never guess lessons.

## 2. Shape it into quiz units

Each section in `course.json` is one quiz.

- Keep the course's own sections when it has them.
- A section with more than 9 lessons becomes two, titled "<Title> (part 1)" and "(part 2)", split as evenly as possible.
- A course with no sections, or one giant section, is chunked into consecutive groups of 4–6 lessons with descriptive titles.

IDs:
- Section `id`: two-digit order prefix plus a kebab-case slug of the title, e.g. `01-foundations`.
- Lesson `id`: the kebab-case last path segment of its URL, unique across the course (add `-2` and so on if needed).
- Course `slug`: kebab-case from the course URL's path, e.g. `ai-development-setup`.

Give each section a `practiceTask`: one concrete, small, hands-on task (15–45 minutes) that applies the section's ideas. Fetch a section's first lesson if its title alone doesn't tell you enough. Practice tasks are optional and never graded.

## 3. Confirm before writing anything

Show the user:
- The course title and URL
- A table of sections: number, title, lesson count, practice task
- The total lesson count and quiz count
- The duration and start date you'll use. Defaults: 10 weekdays (2 weeks) starting next Monday. "N weeks" means 5×N weekdays; "N days" or "N weekdays" means N.
- The schedule's average load (lessons per weekday)

Wait for a clear yes. Apply any changes they ask for and confirm again.

## 4. Write the files

1. If `my-progress/<slug>/progress.json` already exists, stop and ask whether to rebuild the schedule. If yes, use `--force` below; completed lessons, notes and quizzes are kept.
2. Write `my-progress/<slug>/course.json` matching `CourseSchema` in `src/shared/schemas.ts`.
3. Run:
   ```bash
   npm run study:init -- <slug> --weekdays <N> [--start YYYY-MM-DD] [--force]
   ```
   This writes `progress.json` and one notes file per section from `templates/notes.md`, and prints the schedule.
4. Run `npm run check-progress` and fix anything it reports until it passes.

## 5. Hand off

Show the printed schedule. Tell the user:
- `npm run dev` opens the dashboard at http://localhost:5173.
- Notes live in `my-progress/<slug>/notes/`, editable in the dashboard or any editor.
- Anything under **Questions / confusions** is guaranteed to be quizzed.
- `/quiz <section-id>` takes a section's quiz once it's read.
