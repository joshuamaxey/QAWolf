// ! This file only exists so that we can import the 'sortHackerNewsArticles' function into our CLI without the script running automatically when we start the CLI AND while maintaining the assessment's original required functionality (you can still run 'node index.js' in the console and just run the sortHackerNewsArticles script directly without having to deal with the CLI if you want)

import { chromium } from "playwright";

export async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
    await page.goto("https://news.ycombinator.com/newest");

    console.log("Grabbing the first 100 Hacker News articles...");

  // First, we will grab the first 100 articles (their IDs and titles)
  const articles = [];

  while (articles.length < 100) {
    const pageArticles = await page.$$eval('tr.athing.submission', rows => {
      return rows.map(row => {
        const id = row.id;
        const link = row.querySelector('.titleline > a');
        const title = link?.textContent?.trim(); // get rid of any whitespace

        if (id && title) {
          return { id, title };
        }
      })
    });

    articles.push(...pageArticles);

    const moreLink = await page.$('a.morelink');

    await Promise.all([
      moreLink.click()
    ]);
  }

  // Take only the first 100 articles
  let hundredArticles = articles.slice(0, 100);

    console.log("Fetching each article by its ID, then attaching its 'time' attribute...")
  // Now lets use the Hacker News API to fetch each article by its ID so that we can access its 'time' attribute and add it to article since that's how we can verify the order
  for (let article of hundredArticles) {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${article.id}.json`)
    const articleData = await response.json();
    article.time = articleData?.time;
  }

    console.log("Verifying sorting order of articles...")
  // Now we can use Array.every() to check the order of the articles
  const isSorted = hundredArticles.every((article, i, arr) => {
    if (i === 0) return true; // ignore the first article
    return arr[i - 1].time >= article.time; // make sure the current article is 'older' than the previous one
  })

  console.log("Number of articles:", hundredArticles.length);
  console.log("Are the articles sorted correctly by creation date?", isSorted);
}
