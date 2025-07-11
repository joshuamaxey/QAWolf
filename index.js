// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
import { chromium } from "playwright";

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // go to Hacker News
    await page.goto("https://news.ycombinator.com/newest");

    console.log("Grabbing the titles and IDs of the first 100 Hacker News articles...");
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

    console.log("Fetching the articles by their ID, then accessing their 'time' attribute...")
    // Now lets use the Hacker News API to fetch each article by its ID so that we can access its 'time' attribute and add it to article since that's how we can verify the order
    for (let article of hundredArticles) {
      const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${article.id}.json`)
      const articleData = await response.json();
      article.time = articleData?.time;
    }

    console.log("Comparing 'time' attributes to verify sorting order of articles...")
    // Now we can use Array.every() to check the order of the articles
    const isSorted = hundredArticles.every((article, i, arr) => {
      if (i === 0) return true; // ignore the first article
      return arr[i - 1].time >= article.time; // make sure the current article is 'older' than the previous one
    })

    // console.log(hundredArticles);
    console.log("Number of articles:", hundredArticles.length);
    console.log("Are the articles sorted correctly by creation date?", isSorted);
  } finally {
    await browser.close()
  }
}

(async () => {
  await sortHackerNewsArticles();
})();
