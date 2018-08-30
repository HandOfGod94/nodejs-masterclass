/**
 * Library for interacting with stored data
 */

var fs = require("fs");
var path = require("path");
var helpers = require("./helpers");

// Container
var lib = {};

lib.baseDir = path.join(__dirname, "..", ".data");

// Write data to file
lib.create = function(dir, file, data, callback) {
  // open the file
  fs.open(path.join(lib.baseDir, dir, file + ".json"), "wx", function(
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      // convert data to string
      var stringData = JSON.stringify(data);
      fs.writeFile(fileDescriptor, stringData, function(err) {
        if (!err) {
          fs.close(fileDescriptor, function(err) {
            if (!err) {
              callback(false);
            } else {
              callback("Error closing the file");
            }
          });
        } else {
          callback("Error writing to file");
        }
      });
    } else {
      callback("Could not create new file, it may already exist");
    }
  });
};

// Read data
lib.read = function(dir, file, callback) {
  fs.readFile(path.join(lib.baseDir, dir, file + ".json"), "utf-8", function(
    err,
    data
  ) {
    if (!err && data) {
      var parsedata = helpers.parseJsonToObject(data);
      callback(err, parsedata);
    } else {
      callback(err, data);
    }
  });
};

// udpate data
lib.update = function(dir, file, data, callback) {
  fs.open(path.join(lib.baseDir, dir, file + ".json"), "r+", function(err, fd) {
    if (!err && fd) {
      var stringData = JSON.stringify(data);
      fs.truncate(fd, function(err) {
        if (!err) {
          fs.writeFile(fd, stringData, function(err) {
            if (!err) {
              fs.close(fd, function(err) {
                if (!err) {
                  callback(false);
                } else {
                  callback("Error closing a file");
                }
              });
            } else {
              callback("Error updating the data");
            }
          });
        } else {
          callback("Error truncating file");
        }
      });
    } else {
      callback("Could not update file for updating, it may not exist yet");
    }
  });
};

lib.delete = function(dir, file, callback) {
  fs.unlink(path.join(lib.baseDir, dir, file + ".json"), function(err) {
    if (!err) {
      callback(false);
    } else {
      callback("Error deleting a file");
    }
  });
};

module.exports = lib;
