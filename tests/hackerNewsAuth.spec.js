import { test, expect } from "@playwright/test";
import { goToHackerNews, goToHackerNewsLogin, goToProfilePageHN, loginBadCredentialsHN, loginHackerNews, logoutHackerNews, updateAboutSectionHN } from "./helpers/authHelpers";

// Verify that "Hacker News" is visible on the homepage
test('"Hacker News" visible on homepage', async ({ page }) => {
    await goToHackerNews(page);
    await expect(page.getByRole('link', { name: 'Hacker News' })).toBeVisible();
})

// Verify that 'Login' button is visible on login/signup page
test('"Login" is visible on login/signup page', async ({ page }) => {
    await goToHackerNews(page);
    await goToHackerNewsLogin(page);
    await expect(page.getByRole('button', { name: 'login' })).toBeVisible();
})

// Verify that username is visible on homepage after logging in
test('"<username>" is visible on homepage after successful login', async ({ page }) => {
    await goToHackerNews(page);
    await goToHackerNewsLogin(page);
    await loginHackerNews(page);
    await expect(page.getByText("blaiddmaxey")).toBeVisible();
})

// Verify that 'login' is visible on the page after logging out
// Then verify that <username> is not visible on the page
test('After logout, "login" is visible and username is not', async ({ page }) => {
    await goToHackerNews(page);
    await goToHackerNewsLogin(page);
    await loginHackerNews(page);
    await logoutHackerNews(page);
    await expect(page.getByRole('link', { name: 'login' })).toBeVisible();
    await expect(page.getByText("blaiddmaxey")).not.toBeVisible();
})

// Verify that the user's own profile page shows 'change password' link and 'update' button
test('Profile page shows "change password" and "update" button', async ({ page }) => {
    await goToHackerNews(page);
    await goToHackerNewsLogin(page);
    await loginHackerNews(page);
    await goToProfilePageHN(page);
    await expect(page.getByRole('link', { name: 'change password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'update' })).toBeVisible();
})


// Verify that user's 'about' section reflects changes after it's been updated
test('New "about" text visible after updating about section on profile', async ({ page }) => {
    await goToHackerNews(page);
    await goToHackerNewsLogin(page);
    await loginHackerNews(page);
    await goToProfilePageHN(page);
    const newText = await updateAboutSectionHN(page);
    // Make sure the new "about" text is visible on the profile page following update
    await expect(page.getByText(newText)).toBeVisible();
})

// Verify that 'Bad login' is visible on login page after trying to log in with invalid username
test('"Bad login" is visible after trying to log in with invalid username', async ({ page }) => {
    await goToHackerNews(page);
    await goToHackerNewsLogin(page);
    await loginBadCredentialsHN(page);
    await expect(page.getByText("Bad login.")).toBeVisible();
})
