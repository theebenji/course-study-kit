---
name: study-today
description: Show what to study today for a course in my-progress/ (today's lessons, catch-up, quizzes due, progress) and mark lessons as read. Use when the user runs /study-today, asks what's next, or says they finished lessons.
argument-hint: [done <lesson or "all">] [course slug]
---

# Today's study

## Pick the course

List the folders in `my-progress/` that contain a `progress.json`.
- None: tell the user to run `/study-start <course URL>` and stop.
- More than one, and the user didn't name one: ask which.

Read `course.json`, `progress.json` and every `quizzes/<section-id>/attempt-*.json` for that course. Get today's date with `date +%F`.

## Marking lessons done

If the user said they finished lessons ("done", "done all", "done Skills, Configuring Skills"), add those lesson ids to `completedLessons` in `progress.json`. "all" means every lesson scheduled on or before today. Then run `npm run check-progress` and fix anything it reports.

## Report

Keep it short:

- **Progress:** lessons read (x / total) and sections passed (x / total).
- **Today:** the schedule day for today, or the next study day if today has none (say which). List its lessons with links, ✅ on any already read.
- **Catch up:** unread lessons from earlier days, if any.
- **Quiz due:** any section whose quiz day is on or before today and that has no passing attempt. Show the exact command, e.g. `/quiz 01-foundations`. A section whose latest attempt failed needs a re-quiz; say so.
- **Notes:** the path to today's section notes file(s).

If every section has passed, congratulate them and point to `/certificate`.
