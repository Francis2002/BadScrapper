//run npm install puppeteer-core

import puppeteer from "puppeteer-core";

run();

async function run() {
    const auth = 'brd-customer-hl_cec764fc-zone-scraping_browser:9r2gzp7iian3';
    const timeout = 2 * 60* 1000;

    let browser;
    try {
        browser = await puppeteer.connect({
            browserWSEndpoint: `wss://${auth}@brd.superproxy.io:9222/`,
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(timeout);

        await page.goto("https://www.betclic.pt/futebol-s1/top-futebol-europeu-p1");

        const distance = 100; // should be less than or equal to window.innerHeight
        const delay = 100;

        const selector = 'body > app-desktop > div.layout > div > bcdk-content-scroller > div > sports-pinned-competition-page > sports-events-list > bcdk-vertical-scroller > div > div.verticalScroller_wrapper > div';
        const scrollDiv = await page.$(selector);

        let previousHeight = await scrollDiv.evaluate((node) => node.scrollHeight);

        while (true) {
            console.log('previousHeight', previousHeight);
            // Scroll down
            await scrollDiv.evaluate((node) => {
                node.scrollBy(0, 100);
            });
        
            // Wait for some time for new content to load
            await new Promise(resolve => setTimeout(resolve, delay));
        
            const newHeight = await scrollDiv.evaluate((node) => node.scrollHeight);

            console.log('newHeight', newHeight);
        
            // If there's no more vertical scrolling, break the loop
            if (newHeight === previousHeight) {
                console.log('break');
                break;
            }
            
            console.log('scroll');
            previousHeight = newHeight;
        }

        console.log('end scroll');

        const data = await page.evaluate(() => {
            const events = Array.from(document.querySelectorAll('.cardEvent'));
            return events.map(event => {
                //get array with the 2 contestants
                const contestants = Array.from(event.querySelectorAll('.scoreboard_contestantLabel'));
                //get array with the 3 odds
                const odds = Array.from(event.querySelectorAll('.oddValue'));
                return {
                    contestants: contestants.map(contestant => contestant.innerText),
                    odds: odds.map(odd => odd.innerText)
                }
            });
        });

        console.log(data);

    } catch (e) {
        console.log('scrape failed', e);
    }
    finally {
        await browser?.close();
    }
}