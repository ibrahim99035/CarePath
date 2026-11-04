#!/usr/bin/env node
/**
 * Builds the bundled Fayoum boundary layers used by geofencing and the map.
 *
 * Source: geoBoundaries gbOpen EGY ADM2 (OCHA ROMENA / CAPMAS),
 * CC BY 3.0 IGO — https://www.geoboundaries.org
 * Pinned commit so the output is reproducible.
 *
 * Output: public/data/geo/fayoum-markaz.geojson
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/data/geo/fayoum-markaz.geojson");
const SOURCE =
  "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/EGY/ADM2/geoBoundaries-EGY-ADM2_simplified.geojson";

const MARKAZ = {
  Abshaway: "أبشواي",
  Atsa: "إطسا",
  Sinuras: "سنورس",
  Tamya: "طامية",
  "Yousef El sadeq": "يوسف الصديق",
};

// The two "Fayyum" features are the markaz and the city; the city is carved
// out of the markaz, so both are needed for point-in-polygon coverage.
function fayoumLabel(feature) {
  const size = JSON.stringify(feature.geometry).length;
  return size > 5000 ? "مركز الفيوم" : "مدينة الفيوم";
}

function roundCoords(value) {
  if (typeof value[0] === "number") {
    return [Math.round(value[0] * 1e5) / 1e5, Math.round(value[1] * 1e5) / 1e5];
  }
  return value.map(roundCoords);
}

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function polygonsOf(geometry) {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

function insideFayoum(polygons, lon, lat) {
  return polygons.some(([outer, ...holes]) =>
    inRing([lon, lat], outer) &&
    !holes.some((hole) => inRing([lon, lat], hole))
  );
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Boundary download failed: ${response.status}`);
const source = await response.json();

const features = source.features
  .filter(
    (feature) =>
      MARKAZ[feature.properties.shapeName] ||
      feature.properties.shapeName === "Fayyum" ||
      feature.properties.shapeName === "Fayyum City"
  )
  .map((feature) => {
    const nameEn = feature.properties.shapeName;
    const isMarkaz = Boolean(MARKAZ[nameEn]) || (nameEn === "Fayyum" && JSON.stringify(feature.geometry).length > 5000);
    return {
      type: "Feature",
      properties: {
        name_ar: MARKAZ[nameEn] || fayoumLabel(feature),
        name_en: nameEn,
        level: isMarkaz ? "markaz" : "city",
      },
      geometry: {
        type: feature.geometry.type,
        coordinates: roundCoords(feature.geometry.coordinates),
      },
    };
  });

const geojson = {
  type: "FeatureCollection",
  metadata: {
    source: "geoBoundaries gbOpen EGY ADM2",
    source_url: "https://www.geoboundaries.org",
    license: "CC BY 3.0 IGO (OCHA ROMENA / CAPMAS)",
    generated: new Date().toISOString().slice(0, 10),
  },
  features,
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(geojson));

// Validate every geocoded facility against the boundary.
const polygons = features.flatMap((feature) => polygonsOf(feature.geometry));
const facilities = JSON.parse(
  await readFile(resolve(ROOT, "data/facilities.json"), "utf8")
);
const checked = facilities.filter(
  (facility) =>
    typeof facility.lat === "number" && typeof facility.lon === "number"
);
const outside = checked.filter(
  (facility) => !insideFayoum(polygons, facility.lon, facility.lat)
);

const kb = Math.round(JSON.stringify(geojson).length / 1024);
console.log(
  `build-geo: ${features.length} polygons, ${kb} KB -> ${OUT.replace(ROOT + "/", "")}`
);
console.log(
  `build-geo: ${checked.length - outside.length}/${checked.length} geocoded facilities inside Fayoum`
);
if (outside.length) {
  console.log(
    "build-geo: outside boundary (check coordinates):",
    outside.map((facility) => `${facility.id} ${facility.name_ar}`).join(" | ")
  );
}
