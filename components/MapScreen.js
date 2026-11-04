"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { browseFacilities, typeOptions } from "@/lib/facilities";
import { formatDistance } from "@/lib/geo";
import { useLocation } from "@/lib/useLocation";
import { useArea } from "@/lib/useArea";
import MapCanvas, { MAP_TYPE_LEGEND } from "@/components/MapCanvas";
import AreaNotice from "@/components/AreaNotice";
import PageHeader from "@/components/PageHeader";
import { PhoneIcon, PinIcon, AlertIcon, ChevronLeftIcon } from "@/components/Icons";

const TYPES = typeOptions();

export default function MapScreen() {
  const [type, setType] = useState("all");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [focusMode, setFocusMode] = useState("facilities");
  const sheetRef = useRef(null);
  const { status, coords, request } = useLocation();
  const area = useArea(coords);

  useEffect(() => {
    if (selected && sheetRef.current) {
      sheetRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected]);

  useEffect(() => {
    if (
      focusMode === "user" &&
      ["denied", "error", "unavailable"].includes(status)
    ) {
      setFocusMode("facilities");
    }
  }, [status, focusMode]);

  const facilities = useMemo(
    () => browseFacilities({ type, emergencyOnly, coords }),
    [type, emergencyOnly, coords]
  );

  const onSelect = useCallback((facility) => setSelected(facility), []);

  function locate() {
    setFocusMode("user");
    if (status !== "granted" && status !== "locating") {
      request();
    }
  }

  return (
    <div className="map-screen">
      <PageHeader title="الخريطة" sub="منشآت محافظة الفيوم" backHref="/" />

      <AreaNotice area={area} />

      <div className="filters map-screen__filters">
        <div className="chips" aria-label="تصفية حسب النوع">
          <button
            type="button"
            className={`chip${type === "all" ? " is-active" : ""}`}
            onClick={() => setType("all")}
            aria-pressed={type === "all"}
          >
            الكل
          </button>
          {TYPES.map((item) => (
            <button
              key={item.type}
              type="button"
              className={`chip${type === item.type ? " is-active" : ""}`}
              onClick={() => setType(item.type)}
              aria-pressed={type === item.type}
            >
              {item.type}
            </button>
          ))}
        </div>

        <div className="filter-row">
          <span className="result-count">
            {facilities.length.toLocaleString("ar-EG")} منشأة
          </span>
          <div className="row" style={{ gap: 7 }}>
            <button
              type="button"
              className={`chip chip--danger${emergencyOnly ? " is-active" : ""}`}
              onClick={() => setEmergencyOnly((value) => !value)}
              aria-pressed={emergencyOnly}
            >
              <AlertIcon />
              طوارئ
            </button>
            <button
              type="button"
              className={`chip chip--map${focusMode === "user" ? " is-active" : ""}`}
              onClick={locate}
            >
              <PinIcon />
              {status === "locating" ? "جارٍ التحديد…" : "موقعي"}
            </button>
          </div>
        </div>
      </div>

      <MapCanvas
        facilities={facilities}
        user={coords}
        fit={focusMode}
        selectedId={selected?.id || null}
        onSelect={onSelect}
        height="clamp(340px, calc(100dvh - 350px), 720px)"
        className="map-screen__canvas"
      />

      <div className="map-legend" aria-label="مفتاح الخريطة">
        {MAP_TYPE_LEGEND.map((item) => (
          <span key={item.label} className="map-legend__item">
            <i style={{ background: item.color }} aria-hidden="true" />
            {item.label}
          </span>
        ))}
        <span className="map-legend__item">
          <i className="map-legend__user" aria-hidden="true" />
          موقعك
        </span>
      </div>

      {selected ? (
        <section className="map-sheet" aria-live="polite" ref={sheetRef}>
          <div className="map-sheet__head">
            <div>
              <h2>{selected.name_ar}</h2>
              <span>{selected.type}</span>
            </div>
            <button
              type="button"
              className="link-btn"
              onClick={() => setSelected(null)}
              aria-label="إغلاق التفاصيل"
            >
              إغلاق
            </button>
          </div>
          {selected.distance != null ? (
            <div className="map-sheet__meta">
              <PinIcon />
              {formatDistance(selected.distance)} من موقعك
            </div>
          ) : null}
          <div className="map-sheet__actions">
            {selected.phone ? (
              <a
                className="btn btn--primary"
                href={`tel:${String(selected.phone).replace(/[^\d+]/g, "")}`}
              >
                <PhoneIcon />
                اتصال
              </a>
            ) : null}
            <Link
              href={`/facility/?id=${selected.id}`}
              className="btn btn--ghost"
            >
              التفاصيل
              <ChevronLeftIcon />
            </Link>
          </div>
        </section>
      ) : (
        <p className="tiny muted map-hint">
          اضغط على أي علامة في الخريطة لعرض بيانات المنشأة والاتصال بها.
        </p>
      )}
    </div>
  );
}
