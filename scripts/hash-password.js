#!/usr/bin/env node
// Usage: node scripts/hash-password.js "the user's password"
// Prints a bcrypt hash to paste into the APP_USERS environment variable.
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "the password"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log(hash);
});
