/**
 * These are the request handlers
 */

// Dependencies
var _data = require("./data");
var helpers = require("./helpers");

// create routing handler
var handlers = {};

// Users
handlers.users = function(data, callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for user submethods
handlers._users = {};

// Users - post
// Required Data: firstName, lastName, phone, password, tosAgreement
// Optional data: None
handlers._users.post = function(data, callback) {
  // Check that all the required fileds are filled out
  var firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  var tosAgreement =
    typeof data.payload.tosAgreement === "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure user doesn't exist
    _data.read("users", phone, function(err, data) {
      if (err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // Create new User object
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true
          };

          // Save the users
          _data.create("users", phone, userObject, function(err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "could not create new user" });
            }
          });
        } else {
          callback(500, { Error: "Couldn't hash password" });
        }
      } else {
        // User already exists
        callback(400, { Error: "User Already Exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Users - get
// Required data: phone
// Optional data: None
// TODO: Only let authenticated user access the object
handlers._users.get = function(data, callback) {
  // Check that phone number is valid
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.length == 10
      ? data.queryStringObject.phone
      : false;

  if (phone) {
    // Lookup the user
    _data.read("users", phone, function(err, data) {
      if (!err && data) {
        // Remove the hashed password from the user object
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Users - put
// Required Data: phone
// Optional Data: firstName, lastName, password (at least one should be specified)
// TODO: Only authenticated user should be able to upate their own info
handlers._users.put = function(data, callback) {
  // Check for the required field
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.length == 10
      ? data.queryStringObject.phone
      : false;

  // Check for optional field
  var firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      _data.read("users", phone, function(err, userData) {
        if (!err && userData) {
          // udpdate the necessary fields
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.password = helpers.hash(password);
          }

          _data.update("users", phone, userData, function(err) {
            if (!err) callback(200);
            else callback(500, { Error: "Could not update the user" });
          });
        } else {
          callback(400, { Error: "Specified user does not exist" });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Users - delete
// Required Fields: phone
// Optional Field: None
// TODO: Only authenticated users should be able to delete their own account
// TODO: Delete all the references of a particular user
handlers._users.delete = function(data, callback) {
  // Check for required field
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.length == 10
      ? data.queryStringObject.phone
      : false;

  if (phone) {
    _data.delete("users", phone, function(err) {
      if (!err) callback(200);
      else callback(500, { Error: "Unable to delete user" });
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Tokens
handlers.tokens = function(data, callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// container for all token methods
handlers._tokens = {};

// tokens - post
// Required Data: phone, password
// Optional Data: None
handlers._tokens.post = function(data, callback) {
  var phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone && password) {
    // Lookup the user who matches the phone number
    _data.read("users", phone, function(err, userData) {
      if (!err && userData) {
        // hash the sent password and compare it to password stored
        var hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          // if valid create a new token with a random name.
          // Set Expiration date 1 hour
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires
          };

          // store the token
          _data.create("tokens", tokenId, tokenObject, function(err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Unable to create token" });
            }
          });
        } else {
          callback(400, { Error: "Passowrd did not match for specided user" });
        }
      } else {
        callback(400, { Error: "Couldn't find specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required fields" });
  }
};

// tokens - get
handlers._tokens.get = function(data, callback) {};

// tokens - put
handlers._tokens.put = function(data, callback) {};

// tokens - delete
handlers._tokens.delete = function(data, callback) {};

// ping heanlder
handlers.ping = function(data, callback) {
  callback(200);
};

// notFound hander
handlers.notFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
