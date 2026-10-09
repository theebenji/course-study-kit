import type { Attempt, Course, Question, Section } from './schemas.ts'

/**
 * The contract for anything that writes and grades quizzes.
 *
 * Today the engine is Claude Code itself: the `/quiz` skill in
 * `.claude/skills/quiz/SKILL.md` fetches the lessons, asks the questions in chat,
 * grades the answers, and writes an `Attempt` file that the dashboard reads.
 * Nothing in this repo implements the interface in code yet.
 *
 * Future: a server-side engine could implement this by calling the Claude API
 * from `server/` (key in a gitignored `.env.local`), so quizzes could be taken in
 * the browser. The dashboard already only depends on `Attempt` files, so adding
 * that engine wouldn't change how results are stored or displayed.
 */
export interface QuizEngine {
  /**
   * Write fresh questions for a section, following templates/quiz-spec.md.
   * `focus` lists concepts to target: the student's open questions from their
   * notes, or the concepts missed on the previous attempt for a re-quiz.
   */
  generateQuiz(input: {
    course: Course
    section: Section
    notes: string
    kind: Attempt['kind']
    focus: string[]
  }): Promise<Omit<Question, 'yourAnswer' | 'score'>[]>

  /** Grade answers and produce the attempt to save. */
  gradeAttempt(input: {
    section: Section
    questions: Omit<Question, 'yourAnswer' | 'score'>[]
    answers: string[]
    attempt: number
    kind: Attempt['kind']
  }): Promise<Attempt>
}
