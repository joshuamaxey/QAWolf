# Walkthrough

This walkthrough is a summary roadmap that will detail the process of developing a solution to the problem presented in the README as well as the steps that I am taking to go above and beyond what is required.

I have also documented each step of this process in detail within the individual 'step' files, including pseudocode which completely explains my thinking and the iterative problem-solving process as I worked through each step.

## Step 1

The first step I'll take is actually solving the problem that we are tasked with solving here. We want to run a script on Hacker News that will verify that the first 100 articles are sorted correctly by creation date. Here is what I did to complete step 1:

### Grab the first 100 articles on the page.

- Each article is a **tr** with a class name of *athing submission*.
- Each of these contains an **id** as well as a **span**, which contains an **a** tag, which contains the title of the given article.
- I used Playwright's **page.$$eval()** to create an array of the first 100 articles
- I sliced the first 100 articles from our array to ensure that we're only working with the first 100

```js
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
      })
    });

    articles.push(...pageArticles);

    // Click the 'more' button to navigate to the next page
    const moreLink = await page.$('a.morelink');

    await Promise.all([
      page.waitForNavigation(),
      moreLink.click()
    ]);
  }

  let hundredArticles = articles.slice(0, 100);
```

### Access the 'time' attribute of the articles

- The **Hacker News API** allows us to query for articles by their IDs.
- Each article has a '**time**' attribute which shows when it was created (in unix time)
- I looped through our *hundredArticles* array, fetching each article by its ID
- As I fetched each article, I accessed its '**time**' attribute and then added it to that article's object within our array

```js
for (let article of hundredArticles) {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${article.id}.json`)
    const articleData = await response.json();
    article.time = articleData?.time;
  };
```

### Verify the sorting order of the first hundred articles

- At this point, our **hundredArticles** is an array of '*article*' objects which each contain an **id**, **title**, and **time** attribute.
- To verify sorting order, I wrote a simple helper function that uses **Array.every()** to make sure that the articles are sorted correctly.
- Basically, this code just makes sure that each article in our **hundredArticles** array is 'older' than the previous one.

```js
const isSorted = hundredArticles.every((article, i, arr) => {
    if (i === 0) return true; // return true for the first article
    return arr[i - 1].time >= article.time; // make sure that each article is 'older' than the previous one
  });

  console.log(isSorted); // returns True
```

## CLI

## Step 2

## Step 3
