import facilitiesData from "@/data/facilities.json";
import tree from "@/data/decision-tree.json";
import { addDistance, hasCoords } from "@/lib/geo";

export const facilities = facilitiesData;
export const decisionTree = tree;

export const TYPE_ORDER = [
  "مستشفى عام",
  "مستشفى تأمين صحي",
  "مستشفى أطفال",
  "مستشفى تخصصي",
  "مركز طبي حضري",
  "وحدة رعاية أساسية / طب أسرة",
  "عيادة خاصة",
  "صيدلية",
  "أخرى",
];

export function typeRank(type) {
  const index = TYPE_ORDER.indexOf(type);
  return index === -1 ? TYPE_ORDER.length : index;
}

export function getFacilityById(id) {
  return facilities.find((facility) => facility.id === id) || null;
}

export function isEmergencyFacility(facility) {
  return facility?.emergency === true;
}

export function facilityCounts() {
  const hospitals = facilities.filter((f) => f.type.startsWith("مستشفى")).length;
  const emergency = facilities.filter((f) => f.emergency).length;
  const withPhone = facilities.filter((f) => f.phone).length;
  return { total: facilities.length, hospitals, emergency, withPhone };
}

function serviceMatchCount(facility, keywords) {
  if (!keywords || keywords.length === 0) return 0;
  const haystack = (facility.services || []).join(" | ");
  return keywords.reduce(
    (count, keyword) => (haystack.includes(keyword) ? count + 1 : count),
    0
  );
}

function compareNoCoords(a, b) {
  if (b.match !== a.match) return b.match - a.match;
  if (Number(b.emergency) !== Number(a.emergency)) {
    return Number(b.emergency) - Number(a.emergency);
  }
  if (typeRank(a.type) !== typeRank(b.type)) return typeRank(a.type) - typeRank(b.type);
  return a.name_ar.localeCompare(b.name_ar, "ar");
}

function sortByDistance(list) {
  return [...list].sort((a, b) => {
    if (a.match !== b.match) return b.match - a.match;
    if (a.distance == null && b.distance == null) return compareNoCoords(a, b);
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    if (a.distance !== b.distance) return a.distance - b.distance;
    return compareNoCoords(a, b);
  });
}

/**
 * Filter and rank facilities for a care level.
 * Returns up to `limit` facilities with a `distance` field when coords exist.
 */
export function selectFacilities({ level = "primary", specialty = "family" }, coords, limitOverride) {
  const careLevel = tree.care_levels[level] || tree.care_levels.primary;
  const filter = careLevel.facility_filter || {};
  const allowedTypes = new Set(filter.types || []);
  const keywords =
    careLevel.match_services && specialty
      ? tree.specialties?.[specialty]?.service_keywords || []
      : [];

  let pool = facilities.filter((facility) => {
    if (allowedTypes.size > 0 && !allowedTypes.has(facility.type)) return false;
    if (filter.emergency_only && !facility.emergency) return false;
    return true;
  });

  const scored = pool.map((facility) => ({
    ...facility,
    match: serviceMatchCount(facility, keywords),
  }));

  // If the specialty has strong matches, keep them at the top of the list.
  const matched = scored.filter((facility) => facility.match > 0);

  let ranked = scored;
  if (matched.length >= 3) ranked = matched;

  let withDistance = ranked.map((facility) => addDistance(facility, coords));

  withDistance = coords ? sortByDistance(withDistance) : [...withDistance].sort(compareNoCoords);

  const limit = limitOverride || careLevel.limit || 6;

  // Graceful fallback for thin categories: top up with nearby facilities.
  if (withDistance.length < Math.min(3, limit)) {
    const used = new Set(withDistance.map((f) => f.id));
    const fallbackPool = facilities
      .filter((facility) => !used.has(facility.id))
      .map((facility) => ({ ...facility, match: 0 }))
      .map((facility) => addDistance(facility, coords));
    const fallbackSorted = coords
      ? sortByDistance(fallbackPool)
      : [...fallbackPool].sort(compareNoCoords);
    withDistance = [...withDistance, ...fallbackSorted].slice(0, limit);
  }

  return withDistance.slice(0, limit);
}

/** All facilities sorted for browsing, with optional type/emergency filters. */
export function browseFacilities({ type = "all", emergencyOnly = false, coords = null } = {}) {
  let list = facilities.filter((facility) => {
    if (type !== "all" && facility.type !== type) return false;
    if (emergencyOnly && !facility.emergency) return false;
    return true;
  });
  list = list.map((facility) => addDistance(facility, coords));
  if (coords) return sortByDistance(list);
  return [...list].sort(compareNoCoords);
}

export function typeOptions() {
  const counts = new Map();
  for (const facility of facilities) {
    counts.set(facility.type, (counts.get(facility.type) || 0) + 1);
  }
  return TYPE_ORDER.filter((type) => counts.has(type)).map((type) => ({
    type,
    count: counts.get(type),
  }));
}

export { hasCoords };
