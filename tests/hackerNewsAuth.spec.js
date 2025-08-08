import { test, expect } from "@playwright/test";
import { goToHackerNews, goToHackerNewsLogin, goToProfilePageHN, loginHackerNews, logoutHackerNews } from "./helpers/authHelpers";

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

// Verify that 'login' is visible on the page after logging out
// Then verify that <username> is not visible on the page
test('After logout, "login" is visible and username is not', async ({ page }) => {
    await goToHackerNewsLogin(page);
    await loginHackerNews(page);
    await logoutHackerNews(page);
    await expect(page.getByRole('link', { name: 'login' })).toBeVisible();
    await expect(page.getByText("blaiddmaxey")).not.toBeVisible();
})

test('User profile page shows "change password" link and "update" button', async ({ page }) => {
    await goToHackerNewsLogin(page);
    await loginHackerNews(page);
    await goToProfilePageHN(page);
    await expect(page.getByRole('link', { name: 'change password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'update' })).toBeVisible();
})
