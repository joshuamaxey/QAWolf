import { chromium } from "playwright";

export async function findDuplicateAuthors() {
    // launch browser
    const browser = await chromium.launch({ headless: false });
    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        // go to Hacker News
        await page.goto("https://news.ycombinator.com/newest");

        // First, we'll re-use our logic from the sortHackerNewsArticles function to grab the first 100 articles and store them in any array, each with their title and ID.
        console.log("Grabbing the titles and IDs of the first 100 Hacker News articles...");

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

        let hundredArticles = articles.slice(0, 100);

        console.log("Fetching the articles by their ID, then accessing their 'by' attribute...")
        // Next, we'll leverage the Hacker News API to fetch each article by its ID, then access their 'by' attribute (which will tell us the author) and attach them to the articles in our array
        for (let article of hundredArticles) {
            const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${article.id}.json`)
            const articleData = await response.json();
            article.author = articleData?.by;
        }

        // Here we'll check to make sure that we've successfully grabbed the articles with their authors
        // console.log(hundredArticles); // Yep, each article has its author attached
        // console.log(hundredArticles.length);

        // Next we'll create an object to hold the counts of our authors, then loop through the hundred and count how many articles are written by each author
        console.log("Creating author map...")
        const authorMap = {};

        for (let article of hundredArticles) { // loop through all 100 articles
            const author = article.author;

            if (author) {
                authorMap[author] = (authorMap[author] || 0) + 1; // Each time we encounter an author, we will increment the 'count' of that author by 1
            }
        }

        // console.log(authorMap); // Nice! Now we've got an object with all of the authors from the first 100 articles, as well as the 'count' of how many articles were written by each author.

        // Now we will create an array to hold duplicate authors.
        console.log("Building duplicate authors array...")
        const duplicates = [];

        for (let author in authorMap) {
            const count = authorMap[author];
            // const marker = count > 1 ? "+" : ""; // if this author's count is greater than 1, mark it with "+"

            // console.log(`${author}: ${count} article(s) ${marker}`) // print each author with it's count and the marker (or not marker, if they don't have more than 1 article)

            if (count > 1) {
                duplicates.push({ author, count }); // If the author has more than one article, add them to the duplicates array with their count
            }
        }

        // Finally, lets print all of the authors with multiple articles
        if (duplicates.length > 0) {
            console.log("\nAuthors with multiple articles:\n");

            for (const dup of duplicates) {
                console.log(`${dup.author} has ${dup.count} articles`);
            }
        } else {
            console.log("No duplicate authors found within the first 100 articles!")
        }
    } finally {
        await browser.close();
    }
}

// findDuplicateAuthors();
