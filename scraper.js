const puppeteer = require('puppeteer');
const helpers = require('./helpers');
const toCSV = helpers.toCSV;
const splitDateRange = helpers.splitDateRange;
const autoScroll = helpers.autoScroll;

/*
 * Function that scrapes all the tweets from a single twitter advanced search and returns them
 * @input query: The search query
 * @input startDate: Starting date in the format "YYYY-MM-DD"
 * @input endDate: Ending date in the format "YYYY-MM-DD"
 *
 * @return: An array of Tweet objects that contain tweet text, id, timestamp, date, likes, retweets
 */
async function run(query, startDate, endDate, chunks) {
    // hold results to output to csv
    let ret = [];

    // make sure we encode the query correctly for URLs
    let encodedQuery = encodeURI(query);

    //chunk the dates
    let dateChunks = splitDateRange(startDate, endDate, chunks);

    //hold the urls to parse
    let urls = [];
    for (var i = 0; i < dateChunks.length; i += 1) {
        //put the search parameters into the search url
        urls.push(`https://twitter.com/search?l=&q=${encodedQuery}%20since%3A${dateChunks[i].start}%20until%3A${dateChunks[i].end}&src=typd&lang=en`);
    }

    //make and launch a new page
    const browser = await puppeteer.launch({
        headless: true
    });

    for (i = 0; i < urls.length; i += 1) {
        let page = await browser.newPage();

        console.log("Starting scraping on " + urls[i]);
        //goto the twitter search page
        await page.goto(urls[i]);

        //set viewport for the autoscroll function
        await page.setViewport({
            width: 1200,
            height: 800
        });

        //scroll until twitter is done lazy loading
        await autoScroll(page);

        //scrape the tweets
        const tweets = await page.evaluate(function() {
            //constant selector for the actual tweets on the screen
            const TWEET_SELECTOR = '.js-stream-tweet';

            //grab the DOM elements for the tweets
            let elements = Array.from(document.querySelectorAll(TWEET_SELECTOR));

            //create an array to return
            let ret = [];

            //get the info from within the tweet DOM elements
            for (var i = 0; i < elements.length; i += 1) {
                //object to store data
                let tweet = {};

                //get text of tweet
                const TWEET_TEXT_SELECTOR = ".tweet-text";
                tweet.text = elements[i].querySelector(TWEET_TEXT_SELECTOR).textContent;

                //get timestamp
                const TWEET_TIMESTAMP_SELECTOR = '.tweet-timestamp';
                tweet.timestamp = elements[i].querySelector(TWEET_TIMESTAMP_SELECTOR).getAttribute('title');

                //get tweet id
                const TWEET_ID_SELECTOR = 'data-tweet-id';
                tweet.id = elements[i].getAttribute(TWEET_ID_SELECTOR);

                //get likes/retweets
                const ACTIONS_SELECTOR = ".ProfileTweet-actionCountForPresentation";
                let actions = elements[i].querySelectorAll(ACTIONS_SELECTOR);

                //loop through the DOM elements for the actions
                for (var j = 0; j < actions.length; j += 1) {
                    //for some reason, retweets are the 2nd action and likes are the 4th
                    tweet.retweets = actions[1].innerHTML ? actions[1].innerHTML : 0;
                    tweet.likes = actions[3].innerHTML ? actions[3].innerHTML : 0;
                }

                //add tweet data to return array
                ret.push(tweet);
            }
            return ret;
        });

        //add to csv
        ret.push(tweets);

        //close the page
        await page.close();
    }

    //exit the browser
    await browser.close();

    // collapse into one array and return
    return [].concat.apply([], ret);
}

module.exports.run = run;