const fs = require('fs');

if (process.argv.length < 3) {
  console.log("Usage: node convert-pem.js <path-to-your.pem>");
  process.exit(1);
}

const pemPath = process.argv[2];
try {
  const pem = fs.readFileSync(pemPath, 'utf8');
  // Replace actual newlines with the literal string '\n'
  const converted = pem.replace(/\r?\n/g, '\\n');
  console.log("\nCopy the exact string below into Vercel for GITHUB_PRIVATE_KEY:\n");
  console.log(converted);
  console.log("\n");
} catch (error) {
  console.error("Error reading file:", error.message);
}
