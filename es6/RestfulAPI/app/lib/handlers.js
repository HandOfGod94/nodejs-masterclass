/**
 * These are the request handlers.
 * TODO: Change it to class contructs
 */

// Dependecies
const _data = require("./data");
const helpers = require("./helpers");

// create routingn handler
let handlers = {};

// Users
handlers.users = function(data, callback) {
  let acceptableMethods = ["post", "get", "put", "delete"];
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
  let firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  let lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  let phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  let password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  let tosAgreement =
    typeof data.payload.tosAgreement === "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure user doesn't exist
    _data
      .read("users", phone)
      .then(res => {
        callback(400, { Error: "User Already exist" });
      })
      .catch(err => {
        // if we could not read means the record doesn't exist
        let hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          const userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: tosAgreement
          };

          _data
            .create("users", phone, userObject)
            .then(res => callback(200))
            .catch(err => callback(500), {
              Error: "Could not create new user"
            });
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
  let phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.length == 10
      ? data.queryStringObject.phone
      : false;

  if (phone) {
    // Lookup the user
    _data
      .read("users", phone)
      .then(res => {
        let data = res;
        // Remove the hashed password from the user object
        delete data.hashedPassword;
        callback(200, res);
      })
      .catch(err => callback(404));
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
  let phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.length == 10
      ? data.queryStringObject.phone
      : false;

  // Check for optional field
  let firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  let lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  let password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      _data
        .read("users", phone)
        .then(userData => {
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.password = helpers.hash(password);
          }
          return userData;
        })
        .then(res => {
          _data
            .update("users", phone, res)
            .then(res => callback(200))
            .catch(err => callback(500, { Error: "Could not update user" }));
        })
        .catch(err => callback(400, { Error: "Specified user doesn't exist" }));
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
  let phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.length == 10
      ? data.queryStringObject.phone
      : false;

  if (phone) {
    _data
      .delete("users", phone)
      .then(res => callback(200))
      .catch(err => callback(500, { Error: "Unable to delete user" }));
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// ping heanlder
handlers.ping = function(data, callback) {
  callback(200);
};

// notFound hander
handlers.notFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
