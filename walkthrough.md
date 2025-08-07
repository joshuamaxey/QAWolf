# Walkthrough

This walkthrough is a summary roadmap that will detail the process of developing a solution to the problem presented in the README as well as the steps that I am taking to go above and beyond what is required.

I have also documented each step of this process in detail within the individual 'step' files, including pseudocode which completely explains my thinking and the iterative problem-solving process as I worked through each step.

## Step 1 - Sort Hacker News Articles (Verify Sorting Order)

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

I decided to set up a CLI to make my script more interactive, interesting, and to provide myself with the opportunity to continue learning Playwright!

- I decided to use **inquirer** to create the CLI, I'm familiar with this library from some of my projects at App Academy and I really like it because it's super simple to use and looks cool too.
- The first thing I did was install **inquirer** and create a '**cli.js**', then build a simple *main menu* to serve as the entry point for the CLI.
- I decided to give the user a choice between three functions: 1: **verify the sorting order of the first 100 articles**, 2: **Check the first 100 articles for duplicate authors**, 3: **To search the titles of the first 100 articles by a keyword which the user will provide as input**
- I have also maintained the original structure of this assessment, ensuring that you are still able to run '**node index.js**' to check that the '**sortHackerNewsArticles()**' function is working the way that it should independently and that the original assessment requirements have been met without having to deal with the CLI.
- Below is **CLI** that I've implemented using **inquirer**:

```js
import { select } from '@inquirer/prompts';
import input from '@inquirer/input';
import { sortHackerNewsArticles } from './hackerNews.js';
import { findDuplicateAuthors } from "./step2.js";
import { searchByKeyword } from './step3.js';

async function mainMenu() {
    const action = await select({
        message: `Hello! Welcome to the main menu. What would you like to do?`,
        choices: [
            { name: 'Verify sorting ordder of Hacker News articles', value: 'verify' },
            { name: 'Find duplicate authors of Hacker News articles', value: 'authors' },
            { name: 'Search Hacker News articles by keyword', value: 'search' },
            { name: 'Exit', value: 'exit' }
        ]
    });

    switch (action) {
        case 'verify':
            await sortHackerNewsArticles();
            break;
        case 'authors':
            await findDuplicateAuthors();
            break;
        case 'search':
            const keyword = await input({ message: "Enter keyword:" })
            await searchByKeyword(keyword);
            break;
        case 'exit':
            console.log("Goodbye!");
            process.exit(0);
    }

    await mainMenu();
}

mainMenu()
```

## Step 2 - Find Duplicate Authors

Now that our primary task is complete and our CLI is set up, what remains is to write the functions that will allow us to search for duplicate authors among the first 100 articles **and** search through the titles of the first 100 articles by keyword. In step 2, we will build our **findDuplicateAuthors()** function.

### Grab the first 100 articles on the page

- The first thing that I did is grab and re-purpose the code that I used in **sortHackerNewsArticles** to grab the titles and IDs of the first 100 articles, then slice the array from index 0 to index 100 to make sure we've got exactly 100 articles. I won't re-iterate the code here since I've already included it in **Step 1** above.

### Access the 'by' attribute of the articles

- I also re-purposed the same code from step 1 that I used to fetch the articles from the Hacker News API by their unique IDs. Except this time, I targeted the 'by' attribute (which tells us who wrote the article) instead of the 'time' attribute. Since I did make a minor change to this code, I'll include it below:

```js
for (let article of hundredArticles) {
        const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${article.id}.json`)
        const articleData = await response.json();
        article.author = articleData?.by;
    }
```

### Create the author map

- Next, I used an object to create an '**authorMap**' of the authors of our 100 articles. I looped through the '**hundredArticles**' array, adding each author to the map. The author's name is the key, and the value is the number of articles written by that author. I set each author's 'count' to 0 by default, then incremented it by 1 each time we encounter the author after that:

```js
const authorMap = {};

    for (let article of hundredArticles) { // loop through all 100 articles
        const author = article.author;

        if (author) {
            authorMap[author] = (authorMap[author] || 0) + 1; // Each time we encounter an author, we will increment the 'count' of that author by 1
        }
    }
```

### Build the 'duplicate authors' array

- Next, I looped through the authors in our **authorMap** using a for/in loop. If the author located at the current index of the array has a 'count' that is more than 1, I add that author to the '**duplicates**' array along with its **count**, the nubmer of articles written by that author:

```js
const duplicates = [];

    for (let author in authorMap) {
        const count = authorMap[author];

        if (count > 1) {
            duplicates.push({ author, count }); // If the author has more than one article, add them to the duplicates array with their count
        }
    }
```

### Print the duplicates

- Finally, I looped through the **duplicates** array and printed each author's name as well as their count so that the user can clearly see which authors have written more than one article and the number of articles written by that author. I also accounted for a situation where there are no duplicate authors among the first 100 articles.

```js
if (duplicates.length > 0) {
        console.log("\nAuthors with multiple articles:\n");

        for (const dup of duplicates) {
            console.log(`${dup.author} has ${dup.count} articles`);
        }
    } else {
        console.log("No duplicate authors found within the first 100 articles!")
    }
```

## Step 3 - Search Articles by Keyword

The third step I took was to build a **searchByKeyword** function that will take in a keyword from the user, then search through the titles of the first 100 Hacker News articles and return all of the articles that match the keyword. Here's the process involved in building this function:

### Get the first 100 articles

- The first thing that I did is grab and re-purpose the code that I used in **sortHackerNewsArticles** to grab the titles and IDs of the first 100 articles, then slice the array from index 0 to index 100 to make sure we've got exactly 100 articles. I won't re-iterate the code here since I've already included it in **Step 1** above.

### Write the logic for prompting the user for the keyword to search by

- **Inquirer** makes this pretty easy, I just wrote the prompt, converted the string to lowercase, then trimmed any potential whitespace. This code looked cleaner and felt more intuitive when I made it a helper function, so that's what I did:

```js
async function promptForKeyword() {
            const { keyword } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'keyword',
                    message: 'Enter a keyword to search Hacker News titles:',
                }
            ]);
            return keyword.toLowerCase().trim()
        }

        const userKeyword = await promptForKeyword();
```

### Filter and return the articles by keyword

- The last task involved in step 3 was to actually filter the hundred articles by the keyword. I also added a little bit of formatting to the response so that it looks clean in the UI, and accounted for the situation where there are no articles with titles that match the keyword:

```js
if (matches.length > 0) {
            console.log(`\nFound ${matches.length} matching articles for "${userKeyword}":\n`)

            matches.forEach(article => {
                console.log(`[${article.id}]: ${article.title}`);
            })
        } else {
            console.log(`\nNo articles found matching the keyword ${userKeyword}.`)
        }
```

### **Close the browser** after running the scriptsq

- After I tested these functions through the CLI a few times, I realized that I had several chromium windows open. By the time I recognized this, they were all in an unresponsive state. I had to shut down WSL altogether in order to finally get them to close! So I went back and wrapped each of the functions (from step 1, 2, and 3) in a try / finally block and made sure that the browser closes after each task has been performed:

```js

const browser = await chromium.launch({ headless: false });

try {
        const context = await browser.newContext();
        const page = await context.newPage();

        // The rest of the code goes here...

} finally {
    browser.close();
}
```

## Step 4 - Testing with Playwright

- Now that the fundamental goal of this assessment is complete and I've implemented a CLI that allows us to perform a few additional functions, it's time to write some tests.

### Create a spec.js file to test our sortHackerNewsArticles function

- I created a test suite called **sortHackerNewsArticles.spec.js** and wrote several basic unit tests that verify the following:

1. Whether we are able to successfully detect that articles are sorted by timestamp:

```js
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
```

2. Whether we can detect that articles are sorted incorrectly:

```js
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
```

3. Whether we can correctly fetch the articles, then query for them and add their 'time' attribute to each article

```js
export async function getLatestArticleID() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto("https://news.ycombinator.com/newest");

    const articleId = await page.$eval('tr.athing.submission', row => row.id);

    // ...CLOSE. THE. BROWSER.
    await browser.close()

    return articleId;
}

test('Fetches article time from Hacker News API', async () => {
    const articleId = await getLatestArticleID();
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${articleId}.json`)
    const data = await response.json();

    expect(data).toHaveProperty('time');
    expect(typeof data.time).toBe('number');
})
```

When we run **npx playwright test tests/sortHackerNewsArticles.spec.js** from our root directory, all of these tests are passing so we know that things are working the way that they should.
