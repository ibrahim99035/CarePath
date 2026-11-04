"use client";

import { useEffect, useRef, useState } from "react";
import { FAYOUM_BOUNDS, MARKAZ_LABELS, loadBoundary } from "@/lib/geofence";
import { WifiOffIcon } from "@/components/Icons";

const TYPE_COLORS = {
  "مستشفى عام": "#dc2626",
  "مستشفى تأمين صحي": "#ea580c",
  "مستشفى أطفال": "#db2777",
  "مستشفى تخصصي": "#7c3aed",
  "مركز طبي حضري": "#2563eb",
  "وحدة رعاية أساسية / طب أسرة": "#0d9488",
  "عيادة خاصة": "#64748b",
  أخرى: "#64748b",
};

export const MAP_TYPE_LEGEND = [
  { label: "مستشفيات", color: "#dc2626" },
  { label: "مراكز طبية", color: "#2563eb" },
  { label: "وحدات رعاية أساسية", color: "#0d9488" },
  { label: "عيادات", color: "#64748b" },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function phoneHref(phone) {
  const cleaned = String(phone || "").replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : null;
}

function popupHtml(facility) {
  const tel = phoneHref(facility.phone);
  return `
    <div class="map-popup">
      <strong>${escapeHtml(facility.name_ar)}</strong>
      <div class="map-popup__type">${escapeHtml(facility.type)}</div>
      <div class="map-popup__actions">
        ${tel ? `<a href="${tel}">اتصال</a>` : ""}
        <a href="/facility/?id=${encodeURIComponent(facility.id)}">التفاصيل</a>
      </div>
    </div>`;
}

export default function MapCanvas({
  facilities = [],
  user = null,
  height = 360,
  fit = "facilities",
  selectedId = null,
  onSelect = null,
  labels = true,
  className = "",
  ariaLabel = "خريطة منشآت محافظة الفيوم",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const userRef = useRef(null);
  const boundaryRef = useRef(null);
  const tilesRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [boundaryFailed, setBoundaryFailed] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let map = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView([29.31, 30.84], 9);

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);

      L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

      // Governorate + markaz polygons.
      loadBoundary()
        .then((geojson) => {
          if (cancelled || !mapRef.current) return;
          const layer = L.geoJSON(geojson, {
            style: {
              color: "#0f766e",
              weight: 1.2,
              fillColor: "#14b8a6",
              fillOpacity: 0.07,
            },
            onEachFeature: (feature, featureLayer) => {
              featureLayer.bindTooltip(feature.properties?.name_ar || "", {
                sticky: true,
                direction: "center",
                className: "map-tooltip",
              });
            },
          }).addTo(mapRef.current);
          boundaryRef.current = layer;

          if (labels) {
            for (const item of MARKAZ_LABELS) {
              L.marker([item.lat, item.lon], {
                interactive: false,
                icon: L.divIcon({
                  className: "map-label",
                  html: `<span>${escapeHtml(item.name)}</span>`,
                  iconSize: [90, 22],
                  iconAnchor: [45, 11],
                }),
              }).addTo(mapRef.current);
            }
          }

          if (facilities.length === 0) {
            mapRef.current.fitBounds(FAYOUM_BOUNDS, { padding: [14, 14] });
          }
        })
        .catch(() => setBoundaryFailed(true));

      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        mapRef.current = null;
        markersRef.current = null;
        userRef.current = null;
        boundaryRef.current = null;
        tilesRef.current = null;
      }
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap tiles (online only; the vector layers keep working offline).
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;

      if (!online) {
        if (tilesRef.current) {
          mapRef.current.removeLayer(tilesRef.current);
          tilesRef.current = null;
        }
        return;
      }
      if (tilesRef.current) return;

      const tiles = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      );
      tiles.on("tileerror", () => setTilesFailed(true));
      tiles.on("load", () => setTilesFailed(false));
      tiles.addTo(mapRef.current);
      tilesRef.current = tiles;
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, online]);

  // Facility markers.
  useEffect(() => {
    if (!ready || !mapRef.current || !markersRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current || !markersRef.current) return;

      markersRef.current.clearLayers();
      const valid = facilities.filter(
        (facility) =>
          typeof facility.lat === "number" && typeof facility.lon === "number"
      );

      for (const facility of valid) {
        const color = TYPE_COLORS[facility.type] || "#64748b";
        const isSelected = facility.id === selectedId;
        const marker = L.circleMarker([facility.lat, facility.lon], {
          radius: isSelected ? 11 : facility.emergency ? 8 : 7,
          color: facility.emergency ? "#7f1d1d" : "#ffffff",
          weight: isSelected ? 4 : facility.emergency ? 2.5 : 1.5,
          fillColor: color,
          fillOpacity: 0.9,
          bubblingMouseEvents: false,
        });

        if (onSelect) {
          marker.on("click", () => onSelect(facility));
        } else {
          marker.bindPopup(popupHtml(facility), { closeButton: true });
        }
        markersRef.current.addLayer(marker);
      }

      if (fit === "facilities" && valid.length > 0) {
        if (valid.length === 1) {
          mapRef.current.setView([valid[0].lat, valid[0].lon], 14);
        } else {
          mapRef.current.fitBounds(
            valid.map((facility) => [facility.lat, facility.lon]),
            { padding: [26, 26], maxZoom: 14 }
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, facilities, selectedId, onSelect, fit]);

  // User location + accuracy.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;

      if (userRef.current) {
        mapRef.current.removeLayer(userRef.current);
        userRef.current = null;
      }

      if (
        !user ||
        typeof user.lat !== "number" ||
        typeof user.lon !== "number"
      ) {
        return;
      }

      const group = L.layerGroup();
      if (typeof user.accuracy === "number" && user.accuracy > 0) {
        L.circle([user.lat, user.lon], {
          radius: user.accuracy,
          color: "#2563eb",
          weight: 1,
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
        }).addTo(group);
      }
      L.circleMarker([user.lat, user.lon], {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#2563eb",
        fillOpacity: 1,
      })
        .bindTooltip("موقعك", { permanent: false, direction: "top" })
        .addTo(group);

      group.addTo(mapRef.current);
      userRef.current = group;

      if (fit === "user") {
        mapRef.current.setView([user.lat, user.lon], 13);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.lat, user?.lon, user?.accuracy, fit]);

  // Keep a selected facility in view.
  useEffect(() => {
    if (!ready || !mapRef.current || !selectedId) return;
    const selected = facilities.find((facility) => facility.id === selectedId);
    if (selected) {
      mapRef.current.setView([selected.lat, selected.lon], 14, {
        animate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selectedId]);

  const styleHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div className={`map-canvas ${className}`.trim()}>
      <div
        ref={containerRef}
        className="map-canvas__box"
        style={{ height: styleHeight }}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
      />
      {!online || tilesFailed || boundaryFailed ? (
        <div className="map-note" role="status">
          <WifiOffIcon />
          <span>
            {!online
              ? "أنت غير متصل. تُعرض الخريطة المبسطة مع حدود المحافظة والمنشآت."
              : boundaryFailed
                ? "تعذّر تحميل حدود المحافظة. تُعرض المنشآت فقط."
                : "تعذّر تحميل خريطة الأساس. تُعرض الحدود والمنشآت دون بلاطات."}
          </span>
        </div>
      ) : null}
    </div>
  );
}
