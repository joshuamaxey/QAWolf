import { chromium } from "playwright";
import inquirer from 'inquirer';

export async function searchByKeyword() {
    // launch browser
    const browser = await chromium.launch({ headless: true });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto("https://news.ycombinator.com/newest");

        console.log("Grabbing the titles and IDs of the first 100 Hacker News articles...\n");

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

        // // Prompt the user for the keyword to search by
        // const { keyword } = await inquirer.prompt([
        //     {
        //         type: 'input',
        //         name: 'keyword',
        //         message: 'Enter a keyword to search Hacker News titles:',
        //         // Make sure it's not an empty string
        //         validate: input => input.trim().length > 0 || 'Please enter a valid keyword'
        //     }
        // ])

        // // Lets make it lowercase to maximize the effectivness of the search
        // const normalizedKeyword = keyword.toLowerCase().trim()

        // ! Ok, actually, lets just stick this logic in a function
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

        // Now lets filter the hundredArticles by the keyword
        const matches = hundredArticles.filter(article =>
            article.title.toLocaleLowerCase().includes(userKeyword)
        );

        // console.log(matches); // Nice! The matching logic is working
        if (matches.length > 0) {
            console.log(`\nFound ${matches.length} matching articles for "${userKeyword}":\n`)

            matches.forEach(article => {
                console.log(`[${article.id}]: ${article.title}`);
            })
        } else {
            console.log(`\nNo articles found matching the keyword ${userKeyword}.`)
        }

    } finally {
        // Ok also MAKE SURE THE BROWSER CLOSES
        // If there are lingering windows, they'll go unresponsive and become super difficult to close
        await browser.close();
    }
}

// searchByKeyword();
