/**
 * Helpers for various tasks
 */

// dependencies
import crypto from "crypto";
import config from "../config";

class Helpers {
  /**
   * Creates hash for the input string.
   * @param {string} str password string
   * @returns {(boolean | string)} hashed string if string is present,
   * false otherwise
   */
  hash(str) {
    if (typeof str == "string" && str.length > 0) {
      let hash = crypto
        .createHmac("sha256", config.hashingSecret)
        .update(str)
        .digest("hex");
      return hash;
    } else {
      return false;
    }
  }

  /**
   * tries to parse the json object from given string,
   * if not a valid json then it will return empty object
   * @param {string} str json string
   * @returns {*} json object
   */
  parseJsonToObject(str) {
    try {
      let obj = JSON.parse(str);
      return obj;
    } catch (error) {
      return {};
    }
  }

  /**
   * Generates random string of given length.
   * @param {number} strLength lenght of the random string
   * @returns {boolean | string} random string if strLenght is valid, false otherwise
   */
  createRandomString(strLength) {
    strLength =
      typeof strLength === "number" && strLength > 0 ? strLength : false;
    if (strLength) {
      // Define all the possible chars
      let possibleChars = "abdefghijklmnopqrstuvwzyz0123456789";

      // Start the final string
      let str = "";
      for (i = 1; i <= strLength; i++) {
        // get a random char from possible chars
        let randomChar = possibleChars.charAt(
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
  }
}

const helpers = new Helpers();

export default helpers;
