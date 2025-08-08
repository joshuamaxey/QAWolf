// ! Helper functions for testing the Hacker News authentication features

// Open the browser, navigate to the website
export async function goToHackerNews(page) {
    await page.goto("https://news.ycombinator.com/newest")
}

// Navigate to the login/signup page
export async function goToHackerNewsLogin(page) {
    await goToHackerNews(page);
    await page.getByRole('link', { name: 'login' }).click();
}

// Log in to Hacker News
export async function loginHackerNews(page) {
    await goToHackerNewsLogin(page);

    const loginForm = page.locator('form', {
        has: page.getByRole('button', { name: 'login' }),
    });

    await loginForm.locator('input[name="acct"]').fill("blaiddmaxey");
    await loginForm.locator('input[name="pw"]').fill("password")

    await loginForm.getByRole('button', { name: 'login' }).click();
}

// Log out of Hacker News
export async function logoutHackerNews(page) {
    await page.locator('#logout').click();
}

// Go to profile page
export async function goToProfilePageHN(page) {
    await page.locator('#me').click();
}
