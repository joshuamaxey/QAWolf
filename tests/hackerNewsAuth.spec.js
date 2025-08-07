import { test, expect } from "@playwright/test";
import { goToHackerNews, goToHackerNewsLogin, loginHackerNews } from "./helpers/authHelpers";

// Verify that "Hacker News" is visible on the homepage
test('"Hacker News" visible on homepage', async ({ page }) => {
    await goToHackerNews(page);
    await expect(page.getByRole('link', { name: 'Hacker News' })).toBeVisible();
})

// Verify that 'Login' button is visible on login/signup page
test('"Login" is visible on login/signup page', async ({ page }) => {
    await goToHackerNewsLogin(page);
    await expect(page.getByRole('button', { name: 'login' })).toBeVisible();
})

// Verify that username is visible on homepage after logging in
test('"<username>" is visible on homepage after login', async ({ page }) => {
    await goToHackerNewsLogin(page);
    await loginHackerNews(page);
    await expect(page.getByText("blaiddmaxey")).toBeVisible();
})
