/**
 * Geofencing for Fayoum governorate.
 *
 * The bundled GeoJSON contains the seven Fayoum markaz/city polygons from
 * geoBoundaries ADM2 (see scripts/build-geo.mjs). A location is "inside" when
 * it falls in any of them.
 */

export const NEAR_BUFFER_KM = 10;
/** Above this accuracy radius we cannot make a confident inside/outside claim. */
export const UNRELIABLE_ACCURACY_M = 20000;
/** Above this, distances are shown as approximate. */
export const APPROXIMATE_ACCURACY_M = 2000;

export const MARKAZ_LABELS = [
  { name: "الفيوم", lat: 29.309, lon: 30.841 },
  { name: "سنورس", lat: 29.407, lon: 30.867 },
  { name: "إطسا", lat: 29.238, lon: 30.79 },
  { name: "طامية", lat: 29.477, lon: 30.961 },
  { name: "أبشواي", lat: 29.359, lon: 30.681 },
  { name: "يوسف الصديق", lat: 29.283, lon: 30.45 },
];

export const FAYOUM_CENTER = { lat: 29.31, lon: 30.84 };
export const FAYOUM_BOUNDS = [
  [29.05, 30.3],
  [29.62, 31.15],
];

let boundaryPromise = null;

/** Load and cache the boundary layer (works from the service worker cache offline). */
export function loadBoundary() {
  if (!boundaryPromise) {
    boundaryPromise = fetch("/data/geo/fayoum-markaz.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("boundary unavailable");
        return response.json();
      })
      .catch((error) => {
        boundaryPromise = null;
        throw error;
      });
  }
  return boundaryPromise;
}

function polygonsOf(geometry) {
  return geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.coordinates;
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

function inPolygon([x, y], [outer, ...holes]) {
  return inRing([x, y], outer) && !holes.some((hole) => inRing([x, y], hole));
}

/** Squared distance in km² from a point to a segment (local flat projection). */
function segmentDistanceSq(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx - px;
  const y = ay + t * dy - py;
  return x * x + y * y;
}

function distanceToBoundaryKm(polygons, lat, lon) {
  const kmPerLat = 110.574;
  const kmPerLon = 111.32 * Math.cos((lat * Math.PI) / 180);
  let best = Infinity;

  for (const [outer, ...holes] of polygons) {
    for (const ring of [outer, ...holes]) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [ax, ay] = ring[i];
        const [bx, by] = ring[i + 1];
        const distanceSq = segmentDistanceSq(
          lon * kmPerLon,
          lat * kmPerLat,
          ax * kmPerLon,
          ay * kmPerLat,
          bx * kmPerLon,
          by * kmPerLat
        );
        if (distanceSq < best) best = distanceSq;
      }
    }
  }

  return Math.sqrt(best);
}

/**
 * @returns {{
 *   status: "inside"|"near"|"outside"|"unknown",
 *   distanceKm: number|null,
 *   markaz: string|null,
 *   accuracyM: number|null,
 *   approximate: boolean
 * }}
 */
export function analyzeLocation(geojson, { lat, lon, accuracy = null }) {
  const accuracyM =
    typeof accuracy === "number" && Number.isFinite(accuracy) ? accuracy : null;

  if (typeof lat !== "number" || typeof lon !== "number") {
    return { status: "unknown", distanceKm: null, markaz: null, accuracyM, approximate: false };
  }

  if (accuracyM != null && accuracyM > UNRELIABLE_ACCURACY_M) {
    return {
      status: "unknown",
      distanceKm: null,
      markaz: null,
      accuracyM,
      approximate: true,
    };
  }

  const features = geojson?.features || [];
  let markaz = null;

  for (const feature of features) {
    const polygons = polygonsOf(feature.geometry);
    if (polygons.some((polygon) => inPolygon([lon, lat], polygon))) {
      if (feature.properties?.level === "markaz") {
        markaz = feature.properties.name_ar;
      }
      return {
        status: "inside",
        distanceKm: 0,
        markaz: markaz || feature.properties?.name_ar || null,
        accuracyM,
        approximate: accuracyM != null && accuracyM > APPROXIMATE_ACCURACY_M,
      };
    }
  }

  const polygons = features.flatMap((feature) => polygonsOf(feature.geometry));
  const distanceKm = polygons.length ? distanceToBoundaryKm(polygons, lat, lon) : null;

  return {
    status: distanceKm != null && distanceKm <= NEAR_BUFFER_KM ? "near" : "outside",
    distanceKm,
    markaz: null,
    accuracyM,
    approximate: accuracyM != null && accuracyM > APPROXIMATE_ACCURACY_M,
  };
}

export function areaLabel(status) {
  switch (status) {
    case "inside":
      return "داخل محافظة الفيوم";
    case "near":
      return "قريب من حدود الفيوم";
    case "outside":
      return "خارج محافظة الفيوم";
    default:
      return "الموقع غير معروف";
  }
}
