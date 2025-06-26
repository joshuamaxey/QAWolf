// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
import { chromium } from "playwright";

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  // ! So to navigate to a page and grab elements, we need to:

  // 1. Use a selector to find a group of elemnets
  // 2. Extract the info from each elements
  // 3. Return that info into my Node.js context and store it in an array

  // ^ So lets say that we want to grab all of the titles of the articles on the first page.

  // We can use page.$$eval(selector, callback) to find all of the elements matching our selector, execute our callback, and then return the results back to our script.

  // In this case, every article is a <tr></tr> (table row). Each tr has a <span></span> inside of it with a classname of 'titleline'. Inside of the span is an <a></a> tag, and that a's textContent is the title of the article

  // So we can grab the a elements attached to each .titleline, then access their textContent to get the title of the articles.

  const articleTitles = await page.$$eval('.titleline > a', elements => {
    return elements.map(el => el.textContent.trim());
  });

  console.log(articleTitles);
  console.log(articleTitles.length); // 30, so we are returning 30 results per page by default

  // The Hacker News API (https://github.com/jsuau/hacker-news-api) says that we can grab individual articles by sending a GET request to this url:

  // https://hacker-news.firebaseio.com/v0/item/:id

  // ! So before we move forward, lets try to fetch a single article by its ID. And how do we find the ID?

  // Each article on HackerNews is represented as a <tr></tr> tag with a class of "athing submission". Note that NOT all tr tags are articles! Only those with the "athing submission" class.
  // And each <tr class="athing submission"></tr> also has an id, which is the article's id. So each article looks like this:

  // <tr class="athing submission" id="12345"></tr>

  // ^ So what we want to do now is search the page for a <tr></tr> that has a classname of "athing submission", grab its 'id' attribute, and make a fetch call to the Hacker News API to make sure we can grab an article this way.

  const firstArticleId = await page.$eval('tr.athing.submission', el => el.id);
  console.log("First Article ID:", firstArticleId); // Got it!

  // Next, we can use the Hacker News API to fetch this article by its ID.

  const firstArticleResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${firstArticleId}.json`);
  const firstArticleData = await firstArticleResponse.json();
  console.log("First Article:", firstArticleData); // Got it!

  // I see that when we fetch the article, we are able to access several critical properties: The first is 'time' which is actually the creation date of the article in unix time. We need this to verify the order of the articles. We can also access the 'title' of the article, which I think I want to use to make our result more readable down the line so that we're not just staring at a list of numerical IDs.

  // ! Now that we're able to get an article's id and fetch that article by its ID using the Hacker News API, lets grab the first 100 articles all at once.

  // The Hacker News API makes provides a 'limitToFirst' data filter that can be applied as a query parameter.

  // I think that ultimately what we want to do is grab the first 100 articles, then query for each individual article by it's ID so that we can access the time attribute, and THEN make sure that they are all ordered correctly.

  // For now, lets see if we can just successfully grab the first 100 articles.

  // ^ https://hacker-news.firebaseio.com/v0/beststories.json?print=pretty&limitToFirst=100

  // const firstHundredResponse = await fetch(`https://hacker-news.firebaseio.com/v0/beststories.json?print=pretty&orderBy="$priority"&limitToFirst=100.json`)
  // const firstHundredData = await firstHundredResponse.json();
  // console.log(firstHundredData);

  // ! Ok, actually, it looks like this is really only useful for getting the 'top stories' which is not what I'm interested in. I think it would be better to manually grab the first 100 articles using our strategy on line 47, so lets try that instead.

  // So now what we weill do is we'll grab all of the rows (<tr class="athing submission" id="12345"></tr>) and then map over them, grabbing the id and the title from each one before returning them as an array of objects, each with its own id and title.

  const articlesOnPage1 = await page.$$eval('tr.athing.submission', rows => {
    return rows.map(row => {
      const id = row.id;
      const titleElement = row.querySelector('.titleline > a');
      const title = titleElement ? titleElement.textContent.trim() : null;

      return { id, title };
    });
  });

  console.log(articlesOnPage1);
  console.log(articlesOnPage1.length)

  // ! Ok, now we have all the articles on the first page, each with its ID and its title! Of course, right now we only have 30 because we are only looking at the first page. Lets figure out from here how to grab the first 100 articles.

  // ^ Playwright allows us to interact with elements on the page, like pushing buttons. So lets iterate through the pages on Hacker News until we have 100 results, using our previous strategy for getting the articles and their IDs / titles until we reach the number of articles that we need.

  const articles = [];

  while (articles.length < 100) {
    const pageArticles = await page.$$eval('tr.athing.submission', rows => {
      return rows.map(row => {
        const id = row.id;
        const link = row.querySelector('.titleline > a');
        const title = link?.textContent?.trim();

        if (id && title) {
          return { id, title };
        }
      }).filter(Boolean); // filter our any falsey values (null, undefined, etc)
    });

    articles.push(...pageArticles);

    if (articles.length >= 100) break; // Make sure we're not going over

    // Click the 'more' button to navigate to the next page
    const moreLink = await page.$('a.morelink');

    await Promise.all([
      page.waitForNavigation(),
      moreLink.click()
    ]);
  }

  let hundredArticles = articles.slice(0, 100);
  console.log(hundredArticles);
  console.log(hundredArticles.length);

  // ! WOO Ok, so now we've got exactly 100 articles, each with their id and title. So next what we need to do is query for each article individually by its ID, access its 'time' attribute, and then add that time attribute to the object for each article. Once we have that, we should be able to check and verify the order without any problems.

  for (let article of hundredArticles) {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${article.id}.json`)
    const articleData = await response.json();
    article.time = articleData?.time;
  };

  console.log(hundredArticles); // GOT IT, now each article has its 'time' attribute attached.
  console.log(hundredArticles.length); // just to make sure

  // ! Next, we can sort our articles by their 'time' attribute. After that, we will compare the order of the sorted articles to the order of the original articles. If the orders match, then they are in fact sorted correctly

  let sortedArticles = hundredArticles.sort((a, b) => b.time - a.time);
  console.log(sortedArticles);
  console.log(sortedArticles.length);

  // ! We actually don't need to sort the articles ourselves in order to check whethr they are sorted. I thought at first that maybe we should compare the time attributes of the sorted articles to those of the unsorted ones, but I think an easier strategy would be just use .every() to check whether each article of our hundredArticles (which is the list of articles BEFORE we manually sorted them) are ordered by their time attribute.

  // We'll pass in the current article, its index, and the hundredArticles array

  const isSorted = hundredArticles.every((article, i, arr) => {

    if (i === 0) return true; // return true for the first article

    return arr[i - 1].time >= article.time; // make sure that each article is 'older' than the previous one
  });

  console.log(isSorted); // returns True
}


(async () => {
  await sortHackerNewsArticles();
})();
