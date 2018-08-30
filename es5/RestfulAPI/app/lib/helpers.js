/**
 * Helpers for various tasks
 *
 */

// Depedenceies
var crypto = require("crypto");
var config = require("../config");

// Container
var helpers = {};

// Create SHA256 hash
helpers.hash = function(str) {
  if (typeof str == "string" && str.length > 0) {
    var hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

// Parse a JSON String to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (error) {
    return {};
  }
};

// Create a random alphanumeric string of given lenght
helpers.createRandomString = function(strLength) {
  strLength =
    typeof strLength === "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible chars
    var possibleChars = "abdefghijklmnopqrstuvwzyz0123456789";

    // Start the final string
    var str = "";
    for (i = 1; i <= strLength; i++) {
      // get a random char from possible chars
      var randomChar = possibleChars.charAt(
        Math.floor(Math.random() * possibleChars.length)
      );

      // append character to final string
      str += randomChar;
    }

    // Return final string
    return str;
  } else {
    return false;
  }
};

module.exports = helpers;
