// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Valeriy-Dev Automation — smoke', () => {
  test('home loads with all key sections', async ({ page }) => {
    await page.goto('/');

    // Title + headline
    await expect(page).toHaveTitle(/Valeriy-Dev Automation/);
    await expect(page.locator('h1')).toContainText(/Next-Generation Automation/i);

    // Primary nav has anchors and the external pages
    const anchors = ['#services', '#cases', '#faq', '#contact'];
    for (const a of anchors) {
      await expect(page.locator(`.primary-nav a[href="${a}"]`).first()).toBeVisible();
    }
    for (const href of ['product.html', 'pricing.html', 'about.html']) {
      await expect(page.locator(`.primary-nav a[href="${href}"]`).first()).toBeVisible();
    }

    // Sections exist
    for (const id of ['services', 'process', 'tech', 'cases', 'engagement', 'faq', 'contact']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }

    // Services grid has 4 cards
    await expect(page.locator('.services-grid .card')).toHaveCount(4);

    // Footer year
    const year = new Date().getFullYear().toString();
    await expect(page.locator('#year')).toHaveText(year);
  });

  test('contact form validates required fields', async ({ page }) => {
    await page.goto('/#contact');
    await page.locator('#contact-form button[type="submit"]').click();
    await expect(page.locator('.form-status.error')).toBeVisible();
  });

  test('FAQ accordion opens on click', async ({ page }) => {
    await page.goto('/#faq');
    const first = page.locator('.faq-item').first();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
  });

  test('legal pages are reachable', async ({ page }) => {
    await page.goto('/terms.html');
    await expect(page.locator('h1')).toContainText(/Terms of Service/);
    await page.goto('/privacy.html');
    await expect(page.locator('h1')).toContainText(/Privacy Policy/);
  });

  test('product page renders Vega pitch', async ({ page }) => {
    await page.goto('/product.html');
    await expect(page.locator('h1')).toContainText(/Vega/);
    await expect(page.locator('.services-grid .card')).toHaveCount(4);
    await expect(page.locator('.process-list li')).toHaveCount(4);
  });

  test('pricing page lists three plans and comparison table', async ({ page }) => {
    await page.goto('/pricing.html');
    await expect(page.locator('h1')).toContainText(/Transparent pricing/i);
    await expect(page.locator('.plan')).toHaveCount(3);
    await expect(page.locator('.pricing-table tbody tr')).toHaveCount(10);
  });

  test('about page shows mission, timeline, founder', async ({ page }) => {
    await page.goto('/about.html');
    await expect(page.locator('h1')).toContainText(/operating layer/i);
    await expect(page.locator('.timeline li')).toHaveCount(5);
    await expect(page.locator('.founder-card')).toBeVisible();
    await expect(page.locator('.facts-grid .fact')).toHaveCount(6);
  });

  test('404 page is served for unknown routes', async ({ page }) => {
    const res = await page.goto('/this-definitely-does-not-exist', { waitUntil: 'domcontentloaded' });
    // python http.server returns 404 with an error body; skip strict body check.
    expect(res?.status()).toBe(404);
  });
});
