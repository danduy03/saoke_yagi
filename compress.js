const fs = require("fs");
const zlib = require("zlib");

// Read the CSV file
const input = fs.createReadStream("./data/output/all.csv");
// Create a write stream for the output compressed file
const output = fs.createWriteStream("./data/output/all.csv.gz");

// Pipe the input through gzip and write to the output
input.pipe(zlib.createGzip()).pipe(output);
