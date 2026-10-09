import { expect, test } from '@playwright/test'

// Fixture: Demo Course, "today" pinned to 2026-10-13 (day 2 of 3).
// Basics passed on a re-quiz; Advanced not started.

test('today shows the day, progress and sections', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/demo-course$/)
  await expect(page.getByRole('heading', { name: /Today/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'First Steps' })).toBeVisible()
  await expect(page.getByText('2 / 5')).toBeVisible()
  await expect(page.getByText('1 / 2')).toBeVisible()
})

test('ticking a lesson persists across reloads', async ({ page }) => {
  await page.goto('/#/demo-course')
  const box = page.getByRole('checkbox', { name: 'Mark "First Steps" as read' })
  await box.check()
  await expect(page.getByText('3 / 5')).toBeVisible()
  await page.reload()
  await expect(box).toBeChecked()
  await box.uncheck()
  await expect(page.getByText('2 / 5')).toBeVisible()
})

test('notes autosave to disk', async ({ page }) => {
  await page.goto('/#/demo-course/section/02-advanced')
  const editor = page.getByRole('textbox', { name: 'Section notes (Markdown)' })
  await expect(editor).toHaveValue(/# 2\. Advanced/)
  await editor.fill('# 2. Advanced\n\nmy e2e note')
  await expect(page.getByRole('status')).toHaveText('Saved')
  await page.reload()
  await expect(editor).toHaveValue(/my e2e note/)
  await expect(page.getByText('/quiz 02-advanced')).toBeVisible()
})

test('quiz history shows the failed quiz and the passing re-quiz', async ({ page }) => {
  await page.goto('/#/demo-course/section/01-basics')
  await expect(page.getByText('Passed', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Quiz ·/ }).click()
  await expect(page.locator('.big-score')).toHaveText('38%')
  await page.getByRole('link', { name: /Re-quiz 1/ }).click()
  await expect(page.locator('.big-score')).toHaveText('100%')
})

test('certificate stays locked until every section passes', async ({ page }) => {
  await page.goto('/#/demo-course/certificate')
  await expect(page.getByRole('heading', { name: 'Certificate locked' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Advanced' })).toBeVisible()
})
