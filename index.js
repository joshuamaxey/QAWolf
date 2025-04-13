// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  // Since we can't directly modify the functionality of the website to display more than a single page (30 articles) of results, we'll grab the articles from the site and store them here

  let articles = []; // We'll store the titles of the articles here

  while (articles.length < 100) {

    // Each link on the page is a span tag, classname 'titleline'
    // The span has an <a></a> tag inside, which has a link (href) in addition to the text content
    // We can use playwright to select the links (page.$$eval grabs by CSS selectors)
    // So we'll use page.$$eval to grab the <a> tag within the spans with classname 'titleline' (.titleline > a)
    // then we'll map over the 'links', separating each one into an object with a title (link.textContent) and actual url (link.href)

    const pageArticles = await page.$$eval('.titleline > a', links => {
      return links.map(link => ({ title: link.textContent, url: link.href }))
    });

    articles.push(pageArticles); // Then push the articles to the array
  }

  console.log(...articles); // check to see if first 30 articles are added;
  console.log(articles.length) // looks like we are already at more than 30 results, so verify that we have 100

  // ! We are already at 100 results, no need to manually iterate through multiple pages to grab results
}

(async () => {
  await sortHackerNewsArticles();
})();
