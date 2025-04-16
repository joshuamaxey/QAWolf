// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
// const { chromium } = require("playwright");
import { chromium } from "playwright";
import fetch from 'node-fetch';

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  // ! First, grab 100 articles

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

    articles.push(...pageArticles); // Then push the articles to the array
  }

  console.log(...articles); // check to see if first 30 articles are added;
  console.log(articles.length) // looks like we are already at more than 30 results, so verify that we have 100
  // ^ We are already at 100 results, no need to manually iterate through multiple pages to grab results

  // & NOTE After running this code several times, I'm now seeing 120 results. Circle back to this after we figure out how to get the IDs below.

  // ! Then make sure they're ordered by creation date

  // The Hacker News API (https://github.com/HackerNews/API) says that 'items' (such as these stories) are all identified by unique IDs.
  // It also says that each one has a 'time' attribute which is its creation date in unix tiem.
  // So lets see if we can use an article's URL to grab its id, then fetch the 'item' which includes its date


  function getIdFromUrl(url) {
    const urlObj = new URL(url); // parse the URL
    return urlObj.searchParams.get("id");
  }

  console.log(articles[2].url) // make sure we can access the url from individual articles
  console.log(getIdFromUrl(articles[3].url)) // make sure we can get the ID from the url

  // & NOTE We are able to access the url, but many article URLs do NOT contain the article's id. Some do, but many don't. So this helper function cannot consistenly deliver the story 'item' with the 'date' attribute that we need.

  // BUT I do see that even though the article's url might not contain the id, it IS tied to an 'upvote' element (a <td></td>, which contains a <center></center>, which contains an <a></a> tag with an id of 'up_<id_number>') that does contain the id.

  // So maybe we can tie the titleline (span) to its (td), then grab the id this way? So lets write a new function to grab the articles, but also with their ids:

  let articlesWithIds = [];

  while (articlesWithIds.length < 100) {

    const pageArticles = await page.$$eval('tr', rows => {
      return rows.map(row => {
        // Get the article link
        const linkElement = row.querySelector('.titleline > a');
        const link = linkElement ? linkElement.href : null;
        const title = linkElement ? linkElement.textContent : null;

        // Now get the ID from votelinks
        const votelinksElement = row.querySelector('.votelinks > center > a');
        const id = votelinksElement ? votelinksElement.id.split('_')[1] : null;

        if (link && id) {
          return { title, url: link, id }
        }
      }).filter(item => item); // get rid of null entries
    })

    articlesWithIds.push(...pageArticles)

    if (articlesWithIds.length >= 100) {
      articlesWithIds = articlesWithIds.slice(0, 100); // trim to 100 in case we have more, since we began to return 120 after a while in our initial function above (~line 35).
      break;
    }
  }

  console.log(articlesWithIds); // Check if our articles actually have their ids now
  console.log(articlesWithIds.length) // Check length

  // ^ NICE. Now we are able to grab all of the articles, and each includes an id. Next we'll check to see if the ids are correct, and that we can use them to fetch the story 'item' that will actually include the date.

  // & NOTE That it might be more efficient to just directly access the Hacker News API and grab the items that way, vs grabbing them all by URL, accessing the IDs, using the IDs to grab the items, then accesssing the date from the item and ordering them that way...once this solution is finished, we will try it that way and determine which is best.

  // So the next step is to try to fetch the story 'item' by one of our article ids. To do this, we'll use node-fetch.

  // Now we'll grab the story 'item' from the Hacker News API using the article's ID.
  // This will also confirm that the ids for each item are correct

  async function fetchStoryItem(id) {
    if (!id) {
      console.error("No ID provided.");
      return null;
    }

      try {
        // Get the item from the Hacker News API
          const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);

          const storyItem = await response.json();

          if (!storyItem) {
              console.error("story not found for ID:", id);
              return null;
          }

          return storyItem; // If all goes well, return the whole story item

    } catch (error) {
        console.error("Error fetching story:", error);
        return null;
    }
  }

    console.log(articlesWithIds[5].id); // make sure we can grab the id of an article

    // Make an async call to make sure we're returning the correct result
    (async () => {
        const story = await fetchStoryItem(articlesWithIds[5].id);
        console.log(story)
    })();

    // ^ YEP, we are now able to access a story 'item' which includes the 'time' (creation date, unix time)

  // ! Final step: fetch the story items by their id, then add to a new array and sort by their 'time' attribute (creation date in unix time)

  async function fetchAllStoryItems(articles) {
    const finalArticles = []; // Here's where we'll put the final sorted articles

    try {
      for (let article of articles) {
        // Grab the story item by its ID
        const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${article.id}.json`);
        const storyItem = await response.json();

        if (storyItem) {
          finalArticles.push(storyItem);
        } else {
          console.errorr(`Failed to fetch story item for ID: ${article.id}`);
        }
      }

      // Then sort them by their 'time' attribute in descending order (newest first)
      finalArticles.sort((a, b) => b.time - a.time);

      return finalArticles;
    } catch (error) {
      console.error("Error fetching story items:", error);
      return []; // if it doesn't work just return an empty array for now
    }
  }

  // ^ WOO so now we are returning exactly 100 articles, with their details, and they should be in the correct order. But lets verify the order before moving on. Also, move the funciton call above to below so that we can fetch all items and validate their order in a single call

  function validateOrder(articles) {
    const isValid = articles.every((article, index) => {
      // skip the first article
      if (index === 0) return true;

      // Then check to make sure each article's time is less than or equal to the time of the previous article
      return articles[index - 1].time >= article.time;
    });

    return isValid;
  }

  // Moved function call here

  (async () => {
    const sortedArticles = await fetchAllStoryItems(articlesWithIds);
    const isCorrectOrder = validateOrder(sortedArticles);
    console.log("Final Sorted Articles:", sortedArticles);
    console.log("Number of sorted articles:", sortedArticles.length);
    console.log("Are articles sorted correctly?", isCorrectOrder);
  })();
}

(async () => {
  await sortHackerNewsArticles();
})();
