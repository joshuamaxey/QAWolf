import { select } from '@inquirer/prompts';
import input from '@inquirer/input';
import { sortHackerNewsArticles } from './hackerNews.js';
import { findDuplicateAuthors } from "./step2.js";
import { searchByKeyword } from './step3.js';

async function mainMenu() {
    const action = await select({
        message: `\nWhat would you like to do?`,
        choices: [
            { name: 'Verify sorting order of Hacker News articles', value: 'verify' },
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
            await searchByKeyword();
            break;
        case 'exit':
            console.log("Goodbye!");
            process.exit(0);
    }

    await mainMenu();
}

mainMenu()
