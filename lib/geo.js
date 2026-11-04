const EARTH_RADIUS_KM = 6371;

function toRad(value) {
  return (value * Math.PI) / 180;
}

/** Great-circle distance in kilometres. */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

const metersFormatter = new Intl.NumberFormat("ar-EG", {
  maximumFractionDigits: 0,
});

const kmFormatter = new Intl.NumberFormat("ar-EG", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatDistance(km) {
  if (typeof km !== "number" || Number.isNaN(km)) return "";
  if (km < 1) {
    const meters = Math.max(50, Math.round((km * 1000) / 50) * 50);
    return `${metersFormatter.format(meters)} م`;
  }
  if (km < 10) return `${kmFormatter.format(km)} كم`;
  return `${metersFormatter.format(Math.round(km))} كم`;
}

export function hasCoords(facility) {
  return (
    typeof facility?.lat === "number" &&
    typeof facility?.lon === "number" &&
    Number.isFinite(facility.lat) &&
    Number.isFinite(facility.lon)
  );
}

export function addDistance(facility, coords) {
  if (!coords || !hasCoords(facility)) return { ...facility, distance: null };
  return {
    ...facility,
    distance: haversineKm(coords.lat, coords.lon, facility.lat, facility.lon),
  };
}
