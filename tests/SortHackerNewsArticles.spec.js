import { test, expect, chromium } from '@playwright/test';

// ! SortHackerNewsArticles

// * Sorting Logic

test('Articles are sorted in descending order by time', () => {

    // Lets add some fake data
    const articles = [
        { id: 1, time: 300 },
        { id: 2, time: 200 },
        { id: 3, time: 100 }
    ];

    // Now we'll import the same logic that we use within our function
    const isSorted = articles.every((article, i, arr) => {
      if (i === 0) return true; // ignore the first article
      return arr[i - 1].time >= article.time; // make sure the current article is 'older' than the previous one
    })

    expect(isSorted).toBe(true);
})

// * Make sure we fail when we're supposed to

test('Articles are NOT sorted in descending order by time', () => {

    // Copy the same fake data from above except mix up the times
    const articles = [
        { id: 1, time: 300 },
        { id: 2, time: 100 },
        { id: 3, time: 200 }
    ];

    // Copy the sorting logic again
    const isSorted = articles.every((article, i, arr) => {
      if (i === 0) return true; // ignore the first article
      return arr[i - 1].time >= article.time; // make sure the current article is 'older' than the previous one
    })

    expect(isSorted).toBe(false);
})

// * Make sure that we can fetch the article by its ID and access it's time attribute.

// First lets grab the article
export async function getLatestArticleID() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto("https://news.ycombinator.com/newest");

    const articleId = await page.$eval('tr.athing.submission', row => row.id);

    // ...CLOSE. THE. BROWSER.
    await browser.close()

    return articleId;
}

// We want to make sure that we are able to fetch the article by its ID and access its time attribute. This is the same logic that I used in the original function, just simplified a little bit.
test('Fetches article time from Hacker News API', async () => {
    const articleId = await getLatestArticleID();
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${articleId}.json`)
    const data = await response.json();

    expect(data).toHaveProperty('time');
    expect(typeof data.time).toBe('number');
})
