/**
 * These are the request handlers
 */

// Dependencies
var _data = require("./data");
var helpers = require("./helpers");
var config = require("../config");

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
handlers._users.get = function(data, callback) {
  // Check that phone number is valid
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.length == 10
      ? data.queryStringObject.phone
      : false;

  if (phone) {
    // Get the token from headers
    var token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    // Verify that the given token is valid fro the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
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
        callback(403, {
          Error: "Missing required token in header or token is invalid"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Users - put
// Required Data: phone
// Optional Data: firstName, lastName, password (at least one should be specified)
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
    // Get the token from headers
    var token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    // Verify that the given token is valid fro the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
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
        callback(403, {
          Error: "Missing required token in header or token is invalid"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Users - delete
// Required Fields: phone
// Optional Field: None
handlers._users.delete = function(data, callback) {
  // Check for required field
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.length == 10
      ? data.queryStringObject.phone
      : false;

  if (phone) {
    // Get the token from headers
    var token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    // Verify that the given token is valid fro the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        _data.delete("users", phone, function(err) {
          if (!err) callback(200);
          else callback(500, { Error: "Unable to delete user" });
        });
      } else {
        callback(403, {
          Error: "Missing required token in header or token is invalid"
        });
      }
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
// Requried data: id
// Optional data: none
handlers._tokens.get = function(data, callback) {
  // check if id is valid
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Lookup the token
    _data.read("tokens", id, function(err, data) {
      if (!err && data) {
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback) {
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  var extend =
    typeof data.payload.extend == "boolean" && data.payload.extend === true
      ? data.payload.extend
      : false;

  if (id && extend) {
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        // check to make sure that token is not expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // store the updates
          _data.update("tokens", id, tokenData, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not update token expiration" });
            }
          });
        } else {
          callback(400, {
            Error: "token has already expired and cannot be extended"
          });
        }
      } else {
        callback(400, { Error: "Specified token doesn't exits" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields or they are invalid" });
  }
};

// tokens - delete
// Required data: id
// optional data: none
handlers._tokens.delete = function(data, callback) {
  // Check for required field
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.length == 20
      ? data.queryStringObject.id
      : false;

  if (id) {
    _data.delete("tokens", id, function(err) {
      if (!err) callback(200);
      else callback(500, { Error: "Unable to delete token" });
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// verify if given id is currently valid for given user
handlers._tokens.verifyToken = function(id, phone, callback) {
  // lookup the token
  _data.read("tokens", id, function(err, tokenData) {
    if (!err && tokenData) {
      // check token is for given user and has not expired
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Checks
handlers.checks = function(data, callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for checks
handlers._checks = {}

// Checks post
// Required data: protocol (http/https), url, method, successCodes, timeoutSeconds
// Optional Data: None
handlers._checks.post = function(data, callback) {
  // Validate the inputs
  var protocol = typeof data.payload.protocol == "string" && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof data.payload.url == "string" && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof data.payload.method == "string" && ['post','get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof data.payload.successCodes == "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof data.payload.timeoutSeconds == "number" && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // get the token from the headers
    var token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    // Lookup the user by reading the token
    _data.read('tokens', token, function(err, tokenData) {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;

        // Lookup the user data
        _data.read("users", userPhone, function(err, userData) {
          if (!err && userData) {
            var userChecks = typeof(userData.checks) === "object" && userData.checks instanceof Array ? userData.checks : [];

            //Verfiy the user has checks less than maxChecks limit
            if (userChecks.length < config.maxChecks) {
              // Create a random id for the check
              var checkId = helpers.createRandomString(20);

              // Create check object and include user's phone
              var checkObject = {
                'id': checkId,
                'userPhone': userPhone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeoutSeconds': timeoutSeconds
              }

              // save the object
              _data.create("checks", checkId, checkObject, function(err){
                if (!err) {
                  // Add the checkid to users object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update("users", userPhone, userData, function(err) {
                    if (!err) {
                      // Return the data about the new object
                      callback(200, checkObject);
                    } else {
                      callback(500, {'Error': 'Could not update the user with new check'});
                    }
                  })
                } else {
                  callback(500, {'Error': 'Couln\'t create new checks'})
                }
              })
            } else {
              callback(400, {'Error':"user already has the max number of checks ("+ config.maxChecks +")"})
            }
          } else {
            callback(403);
          }
        })
      } else {
        callback(403);
      }
    })
  } else {
    callback(400, {'Error':'Missing required inputs or inputs are invalid'})
  }
}

// Checks - get
// Required Data: id
// Optional Data: none
handlers._checks.get = function(data, callback) {
  // Check that id number is valid
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.length === 20 ? data.queryStringObject.id : false;

  if (id) {

    // Lookup the check
    _data.read("checks", id, function(err, checkData) {
      if (!err && checkData) {
        // Get the token from headers
        var token = typeof data.headers.token === "string" ? data.headers.token : false;

        // Verify that the given token is valid and belongs to the user who created
        handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
          if (tokenIsValid) {
            // Return the check data
            callback(200, checkData);
          } else {
            callback(403, {
              Error: "Missing required token in header or token is invalid"
            });
          }
        });

      } else {
        callback(404)
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Checks  - put
// Required Data: id
// Optional Data: protocol, url, method, successCodes, timeoutSecond. one must be sent
handlers._checks.put = function(data, callback) {
  // Check that id number is valid
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.length === 20 ? data.queryStringObject.id : false;

  // Validate the inputs
  var protocol = typeof data.payload.protocol == "string" && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof data.payload.url == "string" && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof data.payload.method == "string" && ['post','get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof data.payload.successCodes == "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof data.payload.timeoutSeconds == "number" && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;

  // check to make sure id is valid
  if (id) {
    // Check to make sure one or more fields has been sent
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // lookup check
      _data.read('checks', id, function(err, checkData) {
        if (!err && checkData) {
          // Get the token from headers
          var token = typeof data.headers.token === "string" ? data.headers.token : false;

          // Verify that the given token is valid and belongs to the user who created
          handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
            if (tokenIsValid) {
              // update the check where necessary
              if (protocol) checkData.protocol = protocol
              if (url) checkData.url = url
              if (method) checkData.method = method
              if (successCodes) checkData.successCodes = successCodes
              if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;

              // store the new updates
              _data.update('checks', id, checkData, function(err) {
                if (!err) {
                  callback(200)
                } else {
                  callback(500, {Error: 'Unable to update the data'})
                }
              })
            } else {
              callback(403)
            }
          });
        } else {
          callback(400, {'Error': "Check id didn't exist"})
        }
      })
    } else {
      callback(400, {Error: 'Missing fields to update'})
    }
  } else {
    callback(400, {Erro: 'Missing Required filed'})
  }
};

// checks - delete
// Required data: id
// Optional Data: none
handlers._checks.delete = function(data, callback) {
  // Check that id number is valid
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.length === 20 ? data.queryStringObject.id : false;

  if (id) {
    // lookup the check
    _data.read('checks', id, function(err, checkData) {
      if (!err && checkData) {
        // Get the token from headers
        var token = typeof data.headers.token === "string" ? data.headers.token : false;

        // Verify that the given token is valid and belongs to the user who created
        handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
          if (tokenIsValid) {
            // Delete the checkData
            _data.delete('checks', id, function(err) {
              if (!err) {
                // Lookup the user
                _data.read("users", checkData.userPhone, function(err, userData) {
                  if (!err && userData) {
                    // List of user checks
                    var userChecks = typeof(userData.checks) === "object" && userData.checks instanceof Array ? userData.checks : [];

                    // Remote the delete check from their ist
                    var checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1){
                      userChecks.splice(checkPosition, 1);

                      // Resave user data
                      _data.update('users', checkData.userPhone, userData, function(err) {
                        if (!err) {
                          callback(200);
                        } else {
                          callback(500, {Error: "Couldn't update user"})
                        }
                      });
                    } else {
                      callback(500, {Error: 'Could not remove the check '})
                    }

                  } else {
                    callback(500, {Error: 'Could not remove the checks from list of user objects'});
                  }
                });
              } else {
                callback(500, {Error: 'Could not delete the check data'})
              }
            })
          } else {
            callback(403)
          }
        });
      } else {
        callback(400, {Error:'Specified check id does not exist'})
      }
    })
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
