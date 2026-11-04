"use client";

import Link from "next/link";
import { decisionTree, selectFacilities } from "@/lib/facilities";
import { getDangerOptions } from "@/lib/decision";
import { useLocation } from "@/lib/useLocation";
import { useArea } from "@/lib/useArea";
import FacilityRow from "@/components/FacilityRow";
import LocationPrompt from "@/components/LocationPrompt";
import AreaNotice from "@/components/AreaNotice";
import PageHeader from "@/components/PageHeader";
import { AmbulanceIcon, PhoneIcon, InfoIcon } from "@/components/Icons";

const dangerSigns = getDangerOptions(decisionTree);

export default function EmergencyView() {
  const { status, coords, fromCache, request } = useLocation();
  const area = useArea(coords);
  const hospitals = selectFacilities(
    { level: "emergency", specialty: "family" },
    coords
  );

  return (
    <div className="stack">
      <PageHeader title="الطوارئ" sub="لا تنتظر — اطلب المساعدة" backHref="/" />

      <section className="emergency-hero">
        <h1>حالة طارئة؟</h1>
        <p>
          إذا كانت هناك علامة خطر واحدة، اتصل بالإسعاف فوراً أو توجه لأقرب مستشفى
          به قسم طوارئ.
        </p>
        <a href="tel:123" className="ambulance-btn">
          <div>
            <div className="num">123</div>
            <div className="lbl">الإسعاف المصري — اتصال مباشر</div>
          </div>
          <AmbulanceIcon />
        </a>
      </section>

      <div className="section-head" style={{ marginTop: 4 }}>
        <h2>علامات الخطر</h2>
      </div>
      <div className="danger-list">
        {dangerSigns.map((sign) => (
          <div key={sign.id} className="danger-item">
            <span aria-hidden="true">{sign.icon}</span>
            {sign.label}
          </div>
        ))}
      </div>

      <div className="section-head">
        <h2>أقرب مستشفيات الطوارئ</h2>
        <span className="result-count">
          {hospitals.length.toLocaleString("ar-EG")} مستشفيات
        </span>
      </div>

      <LocationPrompt
        status={status}
        fromCache={fromCache}
        onRequest={request}
      />

      <AreaNotice area={area} emergency />

      <div className="list" style={{ marginTop: 12 }}>
        {hospitals.map((hospital) => (
          <FacilityRow key={hospital.id} facility={hospital} />
        ))}
      </div>

      <div className="notice">
        <InfoIcon />
        <span>
          لا تقود السيارة بنفسك في حالة الطوارئ إن كنت تعاني ألماً شديداً أو
          دوخة. اطلب من شخص آخر القيادة، أو اتصل بالإسعاف. جهّز بطاقة الرقم
          القومي وأي تقارير طبية إن أمكن.
        </span>
      </div>

      <Link href="/guide/" className="btn btn--ghost btn--block">
        <PhoneIcon />
        لست متأكداً؟ ابدأ التوجيه الصحي
      </Link>
    </div>
  );
}
