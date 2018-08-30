import http from "http";
import url from "url";
import stringDecoder from "string_decoder";
import config from "./config";
import _data from "./lib/data";
import handlers from "./lib/handlers";
import helpers from "./lib/helpers";

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // get the path and parse it
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // get the method
  const method = req.method.toLowerCase();

  // get querystring parameters
  const queryStringObject = parsedUrl.query;

  // get he headers
  const headers = req.headers;

  // get the payload, if any
  const decoder = new stringDecoder.StringDecoder("utf-8");
  let buffer = "";
  req.on("data", data => {
    buffer += decoder.write(data);
  });
  req.on("end", () => {
    // Sending response and log out the reques
    buffer += decoder.end();

    // request data to be given to handler
    const data = {
      trimmedPath: trimmedPath,
      method: method,
      queryStringObject: queryStringObject,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer)
    };

    // get the chosen handler based on path
    const chosenHander =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // excute the call back and send the response
    chosenHander(data, (statusCode, payload) => {
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      payload = typeof payload === "object" ? payload : {};

      // convert payload to string
      const payloadString = JSON.stringify(payload);

      // write headers and response payload to resp object
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);

      // log the reponse
      console.log("Returning with response: ", statusCode, payloadString);
    });
  });
});

server.listen(config.httpPort, () => {
  console.log(
    `Server is listening on ${config.httpPort} and mode ${config.envName}`
  );
});

// define router
var router = {
  ping: handlers.ping,
  users: handlers.users
};
