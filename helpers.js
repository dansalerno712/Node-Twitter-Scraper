const chunk = require('chunk-date-range');
const dateformat = require('dateformat');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

module.exports = {
    /*
     * Function to write an array of tweets to a csv
     * @input: tweets: An array of tweet objects
     * @return: Nothing, but a csv is created
     */
    "toCSV": function(tweets) {
        // create header schema
        const csvWriter = createCsvWriter({
            path: "output.csv",
            header: [{
                id: "text",
                title: "Text"
            }, {
                id: "timestamp",
                title: "Timestamp"
            }, {
                id: "id",
                title: "ID"
            }, {
                id: "retweets",
                title: "Retweets"
            }, {
                id: "likes",
                title: "Likes"
            }]
        });

        // output to csv
        csvWriter.writeRecords(tweets)
            .then(() => {
                console.log("Done writing to csv");
            });
    },
    /*
     * Function to split the Start/End Date into either chunks or by Date/Week/Month/Year
     * @input startDate: A string in the format YYYY/MM/DD
     * @input endDate: A string in the format YYYY/MM/DD
     * @input chunks: Either a number that specifies how many equal chunks the user wants to 
     * split the date range into or a String day|week|month|year that splits the date range that way
     *
     * @return: An array of {startDate, endDate} objects where start and end date are in the format
     *  of a YYYY/MM/DD string
     */
    "splitDateRange": function(startDate, endDate, chunks) {
        let start = new Date(startDate);
        let end = new Date(endDate);
        let ret = chunk(start, end, chunks);
        return ret.map(function(dateRange) {
            return {
                'start': dateformat(dateRange.start, "yyyy-mm-dd"),
                'end': dateformat(dateRange.end, "yyyy-mm-dd")
            };
        });
    },
    /*
     * Function to scroll on a page until all lazy loading has been done
     * @input page: the page you want to scroll on
     */
    "autoScroll": function(page) {
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
};