"use client";

import { useEffect, useState } from "react";
import { analyzeLocation, loadBoundary } from "@/lib/geofence";

const UNKNOWN = {
  status: "unknown",
  distanceKm: null,
  markaz: null,
  accuracyM: null,
  approximate: false,
};

/**
 * Resolves whether the user's coordinates fall inside Fayoum.
 * Returns a stable object while the boundary file loads.
 */
export function useArea(coords) {
  const [area, setArea] = useState(UNKNOWN);

  const lat = coords?.lat;
  const lon = coords?.lon;
  const accuracy = coords?.accuracy ?? null;

  useEffect(() => {
    if (typeof lat !== "number" || typeof lon !== "number") {
      setArea(UNKNOWN);
      return;
    }

    let cancelled = false;
    setArea((current) => ({ ...current, status: "loading" }));

    loadBoundary()
      .then((geojson) => {
        if (cancelled) return;
        setArea(analyzeLocation(geojson, { lat, lon, accuracy }));
      })
      .catch(() => {
        if (cancelled) return;
        setArea(UNKNOWN);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lon, accuracy]);

  return area;
}
