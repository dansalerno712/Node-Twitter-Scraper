const puppeteer = require('puppeteer');

/*
 * Function that scrapes all the tweets from a single twitter advanced search and outputs them to the console
 * @input query: The search query
 * @input startDate: Starting date in the format "YYYY-MM-DD"
 * @input endDate: Ending date in the format "YYYY-MM-DD"
 *
 * @return: nothing yet
 */
async function run(query, startDate, endDate) {
    // make sure we encode the query correctly for URLs
    let encodedQuery = encodeURI(query);

    //put the search parameters into the search url
    let url = `https://twitter.com/search?l=&q=${encodedQuery}%20since%3A${startDate}%20until%3A${endDate}&src=typd&lang=en`;

    //make and launch a new page
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();

    //goto the twitter search page
    await page.goto(url);

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

    //print to console
    console.log(tweets);

    //exit the browser
    browser.close();
}

/*
 * Function to scroll on a page until all lazy loading has been done
 * @input page: the page you want to scroll on
 */
function autoScroll(page) {
    // evaluate some javascript
    return page.evaluate(function() {
        return new Promise(function(resolve, reject) {
            let totalHeight = 0;

            //distance per scroll
            let distance = 1000;
            let timer = setInterval(function() {
                //get current height
                let scrollHeight = document.body.scrollHeight;

                //scroll and increment
                window.scrollBy(0, distance);
                totalHeight += distance;

                //if we didnt scroll, lazy loading must be done, so return
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
                //how long to wait between scrolls
            }, 1000);
        });
    });
}

run("chocolate covered almonds", "2018-04-14", "2018-04-15");