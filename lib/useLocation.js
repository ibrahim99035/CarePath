"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "carepath:last-location";
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

function readCachedLocation() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.lat === "number" &&
      typeof parsed?.lon === "number" &&
      Date.now() - (parsed.ts || 0) < MAX_AGE_MS
    ) {
      return {
        lat: parsed.lat,
        lon: parsed.lon,
        accuracy:
          typeof parsed.accuracy === "number" ? parsed.accuracy : null,
      };
    }
  } catch {
    /* storage can be unavailable in private mode */
  }
  return null;
}

function writeCachedLocation(coords) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...coords, ts: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

/**
 * Small geolocation helper.
 * status: idle | locating | granted | denied | error | unavailable
 */
export function useLocation({ restore = true } = {}) {
  const [status, setStatus] = useState("idle");
  const [coords, setCoords] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (restore) {
      const cached = readCachedLocation();
      if (cached) {
        setCoords(cached);
        setStatus("granted");
        setFromCache(true);
      }
    }
    return () => {
      mounted.current = false;
    };
  }, [restore]);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current) return;
        const next = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy:
            typeof position.coords.accuracy === "number"
              ? position.coords.accuracy
              : null,
        };
        setCoords(next);
        setStatus("granted");
        setFromCache(false);
        writeCachedLocation(next);
      },
      (error) => {
        if (!mounted.current) return;
        setStatus(error.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return { status, coords, fromCache, request };
}
