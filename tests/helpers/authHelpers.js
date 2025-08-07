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

// Signup for a new account
export async function loginHackerNews(page) {
    await goToHackerNewsLogin(page);

    const loginForm = page.locator('form', {
        has: page.getByRole('button', { name: 'login' }),
    });

    await loginForm.locator('input[name="acct"]').fill("blaiddmaxey");
    await loginForm.locator('input[name="pw"]').fill("password")

    await loginForm.getByRole('button', { name: 'login' }).click();
}
