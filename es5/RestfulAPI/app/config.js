/**
 * Create and export configuration varialbes
 */

// Container for all the elements
var environments = {};

// Staging (Default) env
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "thisIsSecret",
  'maxChecks': 5
};

// Production env
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "thisIsAlsoSecret",
  'maxChecks': 5
};

// Determine which env was passed as cmd line args
var currentEnv =
  typeof process.env.NODE_ENV === "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

// Check that current env is one of the above, if not default to staging
var environmentToExport =
  typeof environments[currentEnv] === "object"
    ? environments[currentEnv]
    : environments.staging;

// export the module
module.exports = environmentToExport;
