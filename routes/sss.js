var express = require('express');
var router = express.Router();
var axios = require('axios');
var url = require('url');
var htmlparser = require("htmlparser2");

/* GET users listing. */
router.get('/', function(req, res, next) {
  let requestedURL = req.query.url;
  console.log("The URL is fetching..");
  console.log(requestedURL);

  axios({
    method: "GET",
    url: requestedURL,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    responseType:'text'
  }).then((response) => {
    res.set('Content-Type', 'text/html');
    res.send(response.data);

  }).catch((err) => {
    console.log("This is console error checker log.");
    console.log(err);
    res.set("Content-Type", "text/json").status(402).send(err);
  });


});

module.exports = router;
