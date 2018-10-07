var express = require('express');
var router = express.Router();
var axios = require('axios');
var url = require('url');

//var Parser = require('../public/javascripts/parser');

const inspectorURLs = {
  css: '/inspector/inspector.css',
  js: '/inspector/inspector.js'
};

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
    res.send(injectSSS(response.data));

  }).catch((err) => {
    console.log("This is console error checker log.");
    console.log(err);
    res.set("Content-Type", "text/json").status(402).send(err);
  });

});

function adjustURL(requestedURL, refURL) {
  let parsed = url.parse(refURL, true);

  let parsedRequestURL = url.parse(requestedURL, true);

  let protocol;
  let host;
  let path='';
  console.log(parsed);
  if(parsed.protocol != undefined) {
    return parsed.href;
  } 

  protocol = "http://";

  if(parsedRequestURL.host == undefined) {
    host = '';
  } else {
    host = parsedRequestURL.host;
  }

  if(parsed.path[0] != '/') {
    let p = parsedRequestURL.path;
    let lastParanthesisIndex = p.lastIndexOf('/');
    path += p.substr(0, lastParanthesisIndex+1);
  }

  path += parsed.path;

  console.log(host);
  console.log(path);
  return protocol + host + path;
}

function cleanQuotes(str) {
  return str.substr(1,str.length-2);
}

function injectSSS(data) {
  let html = '';

  let indexEndHead = data.indexOf("</head>");
  html += data.substring(0, indexEndHead);

  html += 
  `
  <link href="` + inspectorURLs.css + `" rel="stylesheet" media="all">
  <script src="` + inspectorURLs.js + `"></script>
  `;
  
  let indexEndBody = data.indexOf("</body>");
  html += data.substring(indexEndHead, indexEndBody);

  html +=
  `
  <script>
    function init() {
        display(window);
    }
    try{
        inspect(document.body, init);
    }catch(e) {
        reportError(e);
    }
  </script>
  `;

  html += data.substring(indexEndBody);

  console.log(html);
  return html;
}

/* 
  let parser = new Parser(response.data);

  parser.addTagRule((tag) => {
    if(tag.name == 'link' && tag.attrs['href']) {
        let href = cleanQuotes(tag.attrs['href'].val);
        tag.attrs['href'].val = '"' + adjustURL(requestedURL, href) + '"';
    }
  });
  
  parser.addTagRule((tag) => {
    if(tag.name == 'script' && tag.attrs['src']) {
        let src = cleanQuotes(tag.attrs['src'].val);
        tag.attrs['src'].val = '"' +adjustURL(requestedURL, src) + '"';
    }
  });

  let parsedResponse = parser.parse();
*/

module.exports = router;
