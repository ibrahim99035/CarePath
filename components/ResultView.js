"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { decisionTree, selectFacilities } from "@/lib/facilities";
import { getCareLevel } from "@/lib/decision";
import { useLocation } from "@/lib/useLocation";
import { useArea } from "@/lib/useArea";
import FacilityCard from "@/components/FacilityCard";
import LocationPrompt from "@/components/LocationPrompt";
import AreaNotice from "@/components/AreaNotice";
import MapCanvas from "@/components/MapCanvas";
import PageHeader from "@/components/PageHeader";
import { PhoneIcon, InfoIcon } from "@/components/Icons";

export default function ResultView() {
  const params = useSearchParams();
  const level = params.get("level") || "primary";
  const specialty = params.get("specialty") || "family";
  const care = getCareLevel(decisionTree, level);
  const specialtyLabel = decisionTree.specialties?.[specialty]?.label;
  const { status, coords, fromCache, request } = useLocation();
  const area = useArea(coords);

  const facilities = selectFacilities({ level, specialty }, coords);
  const isEmergency = level === "emergency";

  return (
    <div className="stack">
      <PageHeader
        title="نتيجة التوجيه"
        sub="بناءً على إجاباتك"
        backHref="/guide/"
        backLabel="تعديل الإجابات"
      />

      <section className={`level level--${care.color}`} aria-live="polite">
        <div className="level-head">
          <span className="level-icon" aria-hidden="true">
            {care.icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>{care.title}</h1>
            <div className="level-sub">
              {level === "specialty" && specialtyLabel
                ? `التخصص: ${specialtyLabel}`
                : care.subtitle}
            </div>
          </div>
        </div>
        <p>{care.message}</p>
      </section>

      {isEmergency ? (
        <a href="tel:123" className="emergency-call">
          <div>
            <div className="num">123</div>
            <div className="lbl">الاتصال بالإسعاف المصري</div>
          </div>
          <PhoneIcon />
        </a>
      ) : null}

      <LocationPrompt
        status={status}
        fromCache={fromCache}
        onRequest={request}
      />

      <AreaNotice area={area} emergency={isEmergency} />

      {facilities.length > 0 ? (
        <section className="result-map">
          <MapCanvas
            facilities={facilities}
            user={coords}
            fit="facilities"
            height={260}
            ariaLabel="خريطة المنشآت المقترحة"
          />
        </section>
      ) : null}

      <div className="section-head" style={{ marginTop: 4 }}>
        <h2>{isEmergency ? "أقرب مستشفيات الطوارئ" : "منشآت مناسبة قريبة"}</h2>
        <span className="result-count">
          {facilities.length.toLocaleString("ar-EG")} نتائج
        </span>
      </div>

      {facilities.length > 0 ? (
        <div className="rail" aria-label="المنشآت المقترحة">
          {facilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="big">🔎</div>
          لا توجد منشآت مطابقة. جرّب تصفح كل المنشآت.
        </div>
      )}

      <div className="stack-sm" style={{ marginTop: 6 }}>
        <Link href="/facilities/" className="btn btn--ghost btn--block">
          عرض كل المنشآت
        </Link>
        <Link href="/guide/" className="btn btn--soft btn--block">
          إعادة التوجيه من البداية
        </Link>
      </div>

      <div className="notice">
        <InfoIcon />
        <span>
          هذه النتيجة إرشادية وليست تشخيصاً طبياً. إذا ساءت الحالة أو ظهرت علامة
          خطرة، اتصل بالإسعاف على <strong>123</strong> أو توجه لأقرب طوارئ فوراً.
        </span>
      </div>
    </div>
  );
}
