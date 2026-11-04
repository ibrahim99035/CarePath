"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { browseFacilities, typeOptions } from "@/lib/facilities";
import { useLocation } from "@/lib/useLocation";
import { useArea } from "@/lib/useArea";
import FacilityRow from "@/components/FacilityRow";
import LocationPrompt from "@/components/LocationPrompt";
import AreaNotice from "@/components/AreaNotice";
import PageHeader from "@/components/PageHeader";
import { AlertIcon, SortIcon, MapIcon } from "@/components/Icons";

const TYPES = typeOptions();

export default function FacilitiesBrowser() {
  const [type, setType] = useState("all");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [nearest, setNearest] = useState(false);
  const { status, coords, fromCache, request } = useLocation();
  const area = useArea(coords);

  const facilities = useMemo(
    () =>
      browseFacilities({
        type,
        emergencyOnly,
        coords: nearest ? coords : null,
      }),
    [type, emergencyOnly, nearest, coords]
  );

  function toggleNearest() {
    if (status === "granted") {
      setNearest((value) => !value);
      return;
    }
    setNearest(true);
    request();
  }

  return (
    <div>
      <PageHeader
        title="المنشآت الصحية"
        sub="محافظة الفيوم"
        backHref="/"
      />

      <LocationPrompt
        status={status}
        fromCache={fromCache}
        onRequest={request}
      />

      <AreaNotice area={area} />

      <div className="quick-actions">
        <Link href="/map/" className="btn btn--soft btn--block">
          <MapIcon />
          عرض المنشآت على الخريطة
        </Link>
      </div>

      <div className="filters">
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
              طوارئ فقط
            </button>
            <button
              type="button"
              className={`sort-btn${nearest ? " is-active" : ""}`}
              onClick={toggleNearest}
              aria-pressed={nearest}
            >
              <SortIcon />
              الأقرب أولاً
            </button>
          </div>
        </div>
      </div>

      {facilities.length > 0 ? (
        <div className="list">
          {facilities.map((facility) => (
            <FacilityRow key={facility.id} facility={facility} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="big">🏥</div>
          لا توجد منشآت مطابقة لهذه الفلاتر.
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setType("all");
                setEmergencyOnly(false);
              }}
            >
              إزالة الفلاتر
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
