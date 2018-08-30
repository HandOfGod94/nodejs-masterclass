/**
 * Library for interacting with stored data
 */

// Dependecies

import fs from "fs";
import path from "path";
import helpers from "./helpers";
import expose from "./expose";

const __dirname = expose.__dirname;

class Lib {
  constructor() {
    this.baseDir = path.join(__dirname, "..", ".data");
  }

  /**
   * Creates a file under directory name, following similar
   * strategy such as tablename -> record ~ directory -> filename
   * @param {string} dir directory name analogus to table name
   * @param {string} file file name analogus to primary key
   * @param {*} data data which needs to be saved
   */
  create(dir, file, data) {
    let filePath = path.join(this.baseDir, dir, file + ".json");
    let stringData = JSON.stringify(data);
    let result = fs.promises
      .open(filePath, "wx")
      .then(res => res.writeFile(stringData))
      .catch(err => `Unable to create new user: ${err}`);
    return result;
  }

  /**
   * Reads a record from file system database based on the primary key
   * and tablename passed to the function
   * @param {string} dir directory name analogous to tablename
   * @param {string} file filename analogus to primary key record
   */
  read(dir, file) {
    let filePath = path.join(this.baseDir, dir, file + ".json");

    let result = fs.promises
      .readFile(filePath, "utf-8")
      .then(res => helpers.parseJsonToObject(res));
    return result;
  }

  /**
   * Updates a given json record based on the keyname(filename)
   * @param {string} dir directory name analogus to tablename
   * @param {string} file filename analogus to primary key of record
   * @param {*} data json object which needs updation
   */
  update(dir, file, data) {
    let filePath = path.join(this.baseDir, dir, file + ".json");
    let stringData = JSON.stringify(data);
    let result = fs.promises
      .open(filePath, "r+")
      .then(res => res.truncate())
      .then(res => res.writeFile(res.fd, stringData));

    return result;
  }

  /**
   * Deletes a record based on the keyName (filename) from table(directory).
   * @param {string} dir directory name analogus to tablename
   * @param {string} file filename analogus to primary key of record
   */
  delete(dir, file) {
    let filePath = path.join(this.baseDir, dir, file + ".json");
    let result = fs.promises.unlink(filePath);
    return result;
  }
}

const lib = new Lib();

export default lib;
