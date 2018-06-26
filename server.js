const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const scraper = require("./scraper");
const toCSV = require("./helpers").toCSV;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/', (req, res) => res.send("Henlo World"));

app.post('/scrape', async (req, res) => {
    let term = req.body.term;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let chunk = req.body.chunk;
    let email = req.body.email;

    res.status(200);
    res.send("Starting Scraping");

    let ret = await scraper.run(term, startDate, endDate, chunk);
    console.log(ret);

    //TODO: Create a uniquely identified CSV and save it somewhere
    
    //TODO: Send csv in email
});

app.listen(3000, () => console.log("Listening on 3000"));