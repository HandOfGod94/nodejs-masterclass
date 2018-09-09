/**
 * Primary file for the API
 */

// Dependecies
var http = require("http");
var https = require("https");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./config");
var fs = require("fs");
var handlers = require("./lib/handlers");
var helpers = require("./lib/helpers");

// Create a server and respond it with a string
var httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

// start the server
httpServer.listen(config.httpPort, function() {
  console.log("HTTP server is listening on " + config.httpPort);
});

// server options
// var httpsServerOpts = {
//   key: fs.readFileSync("./https/key.pem"),
//   cert: fs.readFileSync("./https/cert.pem")
// };

// create https server
// var httpsServer = https.createServer(httpsServerOpts, function(req, res) {
//   unifiedServer(req, res);
// });

//start the https server
// httpsServer.listen(config.httpsPort, function() {
//   console.log("HTTPS server is listening on " + config.httpsPort);
// });

// All the server logic for both http and https
var unifiedServer = function(req, res) {
  // get the url and parse it
  var parsedUrl = url.parse(req.url, true);

  // get the path from the url
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // get the query string
  var queryStringObject = parsedUrl.query;

  // get the method
  var method = req.method.toLowerCase();

  // get headers as object
  var headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder("utf-8");
  var buffer = "";

  req.on("data", function(data) {
    buffer += decoder.write(data);
  });

  req.on("end", function() {
    buffer += decoder.end();

    // chose the handle this request this should go to
    var chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // construct the data object to send to the handler
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer)
    };

    // route the request to handler specified in handler
    chosenHandler(data, function(statusCode, payload) {
      // use the statucode called back by the handler or default to 200
      var statusCode = typeof statusCode === "number" ? statusCode : 200;

      // use the payload called back by the handler or default to object
      var payload = typeof payload === "object" ? payload : {};

      // convert the object to string
      var payloadString = JSON.stringify(payload);

      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);

      // log the path
      console.log("Returning this response: ", statusCode, payloadString);
    });
  });
};

// define router
var router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
};
