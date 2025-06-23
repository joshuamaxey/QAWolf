// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
import { chromium } from "playwright";

// Navigate to https://news.ycombinator.com/newest
// Scrape links and their IDs for the first 100 articles
// Fetch their 'time' metadata (the Hacker News API says that all itesm are identified by unique IDs AND have a 'time' attribute)
// Compare the timestamps to make sure they're in descending order
// Then print our result

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  const articles = page.getByRole('cell');
  console.log(articles);

}

(async () => {
  await sortHackerNewsArticles();
})();
