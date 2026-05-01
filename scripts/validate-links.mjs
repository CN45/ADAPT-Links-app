import { readFileSync } from "node:fs";

const links = JSON.parse(readFileSync("src/data/links.json", "utf8"));
const requiredFields = [
  "title",
  "url",
  "description",
  "category",
  "tags",
  "addedBy",
  "dateAdded",
  "recommended",
  "status"
];
const seenUrls = new Set();
const errors = [];

if (!Array.isArray(links)) {
  errors.push("src/data/links.json must contain an array.");
}

for (const [index, link] of links.entries()) {
  for (const field of requiredFields) {
    if (!(field in link)) {
      errors.push(`Link ${index + 1} is missing "${field}".`);
    }
  }

  try {
    new URL(link.url);
  } catch {
    errors.push(`Link ${index + 1} has an invalid URL: ${link.url}`);
  }

  if (seenUrls.has(link.url)) {
    errors.push(`Duplicate URL: ${link.url}`);
  }

  seenUrls.add(link.url);

  if (!Array.isArray(link.tags)) {
    errors.push(`Link ${index + 1} tags must be an array.`);
  }

  if (!["active", "needs-review", "archived"].includes(link.status)) {
    errors.push(`Link ${index + 1} has an invalid status: ${link.status}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${links.length} links.`);
