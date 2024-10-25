const fs = require("fs");
const path = require("path");

// Construct the path to the JSON configuration file
const testConfigPath = path.join(__dirname, "database", "test.json");

// Load the test configuration
const testConfig = JSON.parse(fs.readFileSync(testConfigPath, "utf-8"));

// Write the DATABASE_URL to a .env file
const envContent = `DATABASE_URL="${testConfig.DATABASE_URL}"`;
fs.writeFileSync(".env", envContent);
