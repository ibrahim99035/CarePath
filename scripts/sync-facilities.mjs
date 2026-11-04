/**
 * Sync the CarePath client data from the master Fayoum dataset.
 *
 * Usage: npm run sync:data
 * Source: ../data/fayoum_health_facilities.json (project root data folder)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = path.resolve(root, "..", "data", "fayoum_health_facilities.json");

if (!fs.existsSync(source)) {
  console.error(`sync-facilities: source not found: ${source}`);
  process.exit(1);
}

const records = JSON.parse(fs.readFileSync(source, "utf8"));

function splitList(value, separator) {
  if (!value || value === "nan") return [];
  return String(value)
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

const facilities = records.map((record) => ({
  id: record.id,
  name_ar: record.name_ar,
  name_en: record.name_en || "",
  type: record.type,
  address: record.address || "",
  landmark: record.landmark || "",
  phone: record.phone || "",
  whatsapp: record.whatsapp || "",
  opening_hours: record.opening_hours || "",
  services: splitList(record.services, "؛"),
  emergency: String(record.emergency || "no").toLowerCase() === "yes",
  required_documents: splitList(record.required_documents, "+"),
  lat: typeof record.lat === "number" ? record.lat : null,
  lon: typeof record.lon === "number" ? record.lon : null,
  verified: String(record.verified || "no").toLowerCase() === "yes",
  last_update: record.last_update || "",
  notes: record.notes || "",
  source: record.source || "",
}));

const json = `${JSON.stringify(facilities, null, 1)}\n`;
const targets = [
  path.join(root, "data", "facilities.json"),
  path.join(root, "public", "data", "facilities.json"),
];

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, json, "utf8");
}

const withCoords = facilities.filter((f) => f.lat !== null && f.lon !== null);
console.log(
  `sync-facilities: wrote ${facilities.length} facilities ` +
    `(${withCoords.length} with coordinates) to data/ and public/data/`
);
