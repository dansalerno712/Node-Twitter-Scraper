const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const scraper = require("./scraper");
const toCSV = require("./helpers").toCSV;
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const sendEmail = require("./helpers").sendEmail;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var mongoURL = 'mongodb://localhost:27017';

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

    MongoClient.connect(mongoURL, (err, client) => {
        assert.equal(null, err);

        var db = client.db('tweetFiles')

        file = {
            term: term,
            startDate: startDate,
            endDate: endDate,
        };
        db.collection('files').insertOne(file, (err, response) => {
            if (err) {
                throw err;
            } else {
                path = "./files/" + response.ops[0]._id + ".csv";
                toCSV(ret, path);
                let link = "http://localhost:3000/download?id=" + response.ops[0]._id
                sendEmail(email, link);
            }
        });

        client.close();
    });
});

app.get("/download", (req, res) => {
    let id = req.query.id
    let path = __dirname + "/files/" + id + ".csv";
    res.download(path);
});

app.listen(3000, () => console.log("Listening on 3000"));