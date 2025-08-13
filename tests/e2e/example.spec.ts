import { test, expect } from '@playwright/test'

test('landing page renders and navigates', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Hemen Başla/i })).toBeVisible()
  await page.getByRole('button', { name: /Hemen Başla/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})


