// ! Helper functions for testing the Hacker News authentication features
import uniqueUsernameGenerator from "unique-username-generator";

// Open the browser, navigate to the website
export async function goToHackerNews(page) {
    await page.goto("https://news.ycombinator.com/newest")
}

// Navigate to the login/signup page
export async function goToHackerNewsLogin(page) {
    await page.getByRole('link', { name: 'login' }).click();
}

// Log in to Hacker News
export async function loginHackerNews(page) {
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

// Update 'about' section
export async function updateAboutSectionHN(page) {
    const newAboutText = uniqueUsernameGenerator.generateUsername();
    // console.log(newAboutText);

    await page.locator('textarea[name="about"]').fill(newAboutText);
    await page.getByRole('button', { name: 'update' }).click();

    return newAboutText;
}

// Log in with bad credentials
export async function loginBadCredentialsHN(page) {
    const loginForm = page.locator('form', {
        has: page.getByRole('button', { name: 'login' }),
    });

    await loginForm.locator('input[name="acct"]').fill("invalidusername");
    await loginForm.locator('input[name="pw"]').fill("password")

    await loginForm.getByRole('button', { name: 'login' }).click();
}
