import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import type { CourseBundle } from '../shared/schemas.ts'
import { QuizScreen } from './QuizScreen.tsx'

const read = (p: string) => JSON.parse(readFileSync(`tests/fixtures/progress/demo-course/${p}`, 'utf8'))
const bundle: CourseBundle = {
  course: read('course.json'),
  progress: read('progress.json'),
  attempts: { '01-basics': [read('quizzes/01-basics/attempt-01.json'), read('quizzes/01-basics/attempt-02.json')] },
  today: '2026-10-13',
}

describe('QuizScreen', () => {
  it('shows the latest attempt by default', () => {
    render(<QuizScreen bundle={bundle} sectionId="01-basics" attempt={null} />)
    expect(screen.getByText('100%', { selector: '.big-score' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Re-quiz 1/ })).toHaveAttribute('aria-current', 'page')
  })

  it('shows a failed attempt with corrections but no re-quiz command once a later attempt exists', () => {
    render(<QuizScreen bundle={bundle} sectionId="01-basics" attempt={1} />)
    expect(screen.getByText('38%', { selector: '.big-score' })).toBeInTheDocument()
    expect(screen.getByText('Turn the check off.')).toBeInTheDocument()
    expect(screen.getAllByText('Correct answer')).toHaveLength(3)
    expect(screen.queryByText('/quiz 01-basics')).not.toBeInTheDocument()
  })

  it('offers the quiz command when nothing has been taken', () => {
    render(<QuizScreen bundle={{ ...bundle, attempts: {} }} sectionId="02-advanced" attempt={null} />)
    expect(screen.getByText('/quiz 02-advanced')).toBeInTheDocument()
  })
})
