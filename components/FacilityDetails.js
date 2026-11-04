"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getFacilityById } from "@/lib/facilities";
import { hasCoords } from "@/lib/geo";
import { useLocation } from "@/lib/useLocation";
import { phoneHref } from "@/components/FacilityCard";
import MapCanvas from "@/components/MapCanvas";
import PageHeader from "@/components/PageHeader";
import {
  PhoneIcon,
  PinIcon,
  NavigationIcon,
  ClockIcon,
  DocIcon,
  AlertIcon,
  InfoIcon,
  HospitalIcon,
} from "@/components/Icons";

export default function FacilityDetails() {
  const params = useSearchParams();
  const id = params.get("id");
  const facility = id ? getFacilityById(id) : null;
  const { coords } = useLocation();

  if (!facility) {
    return (
      <div className="stack">
        <PageHeader title="تفاصيل المنشأة" backHref="/facilities/" />
        <div className="empty">
          <div className="big">🏥</div>
          لم نجد هذه المنشأة في الدليل.
          <div style={{ marginTop: 18 }}>
            <Link href="/facilities/" className="btn btn--primary">
              تصفح كل المنشآت
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tel = phoneHref(facility.phone);
  const coordsAvailable = hasCoords(facility);
  const directions = coordsAvailable
    ? `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${facility.name_ar} الفيوم`
      )}`;

  const services = facility.services || [];
  const documents = facility.required_documents || [];

  return (
    <div className="stack">
      <PageHeader title="تفاصيل المنشأة" backHref="/facilities/" />

      <section className="detail-hero">
        <div className="badges">
          <span className="badge badge--type">{facility.type}</span>
          {facility.emergency ? (
            <span className="badge badge--emergency">
              <AlertIcon />
              طوارئ
            </span>
          ) : null}
          <span
            className={`badge ${facility.verified ? "badge--ok" : "badge--warn"}`}
          >
            {facility.verified ? "موثّق ميدانياً" : "غير موثّق ميدانياً"}
          </span>
        </div>

        <h1>{facility.name_ar}</h1>
        {facility.name_en ? <div className="en">{facility.name_en}</div> : null}

        <p className="f-card__addr" style={{ marginTop: 10 }}>
          <PinIcon />
          <span>{facility.address || "محافظة الفيوم"}</span>
        </p>

        <div className="detail-actions">
          {tel ? (
            <a className="btn btn--primary" href={tel}>
              <PhoneIcon />
              اتصال
            </a>
          ) : (
            <span className="btn btn--ghost btn--disabled">
              <PhoneIcon />
              لا يوجد رقم
            </span>
          )}
          <a
            className="btn btn--ghost"
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
          >
            <NavigationIcon />
            الاتجاهات
          </a>
        </div>
      </section>

      <section className="card">
        <div className="info-list">
          {facility.address ? (
            <div className="info-item">
              <span className="info-item__icon">
                <PinIcon />
              </span>
              <div className="info-item__body">
                <div className="info-item__label">العنوان</div>
                <div className="info-item__value">{facility.address}</div>
              </div>
            </div>
          ) : null}

          {facility.landmark ? (
            <div className="info-item">
              <span className="info-item__icon">
                <HospitalIcon />
              </span>
              <div className="info-item__body">
                <div className="info-item__label">علامة مميزة</div>
                <div className="info-item__value">{facility.landmark}</div>
              </div>
            </div>
          ) : null}

          {facility.phone ? (
            <div className="info-item">
              <span className="info-item__icon">
                <PhoneIcon />
              </span>
              <div className="info-item__body">
                <div className="info-item__label">الهاتف</div>
                <div className="info-item__value">
                  {tel ? (
                    <a className="phone" href={tel} dir="ltr">
                      {facility.phone}
                    </a>
                  ) : (
                    facility.phone
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {facility.whatsapp ? (
            <div className="info-item">
              <span className="info-item__icon">
                <PhoneIcon />
              </span>
              <div className="info-item__body">
                <div className="info-item__label">واتساب</div>
                <div className="info-item__value">
                  <span className="phone" dir="ltr">
                    {facility.whatsapp}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="info-item">
            <span className="info-item__icon">
              <ClockIcon />
            </span>
            <div className="info-item__body">
              <div className="info-item__label">ساعات العمل</div>
              <div className="info-item__value">
                {facility.opening_hours ||
                  "غير محددة — يُفضّل الاتصال قبل التوجه"}
              </div>
            </div>
          </div>

          <div className="info-item">
            <span className="info-item__icon">
              <AlertIcon />
            </span>
            <div className="info-item__body">
              <div className="info-item__label">الطوارئ</div>
              <div className="info-item__value">
                {facility.emergency
                  ? "يتوفر قسم طوارئ"
                  : "لا يتوفر قسم طوارئ حسب البيانات المتاحة"}
              </div>
            </div>
          </div>

          <div className="info-item">
            <span className="info-item__icon">
              <DocIcon />
            </span>
            <div className="info-item__body">
              <div className="info-item__label">المستندات المطلوبة</div>
              <div className="info-item__value">
                {documents.length > 0
                  ? documents.join("، ")
                  : "لا توجد مستندات محددة"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-head" style={{ marginTop: 2 }}>
        <h2>الخدمات المتاحة</h2>
      </div>
      <section className="card">
        {services.length > 0 ? (
          <div className="service-chips" style={{ marginTop: 0 }}>
            {services.map((service) => (
              <span key={service} className="service-chip">
                {service}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted small">
            لم تُسجّل خدمات تفصيلية لهذه المنشأة. اتصل للتأكد من الخدمة المطلوبة.
          </p>
        )}
      </section>

      <div className="section-head" style={{ marginTop: 2 }}>
        <h2>الموقع على الخريطة</h2>
      </div>
      <MapCanvas
        facilities={
          coordsAvailable
            ? [{ ...facility, distance: null }]
            : []
        }
        user={coords}
        fit="facilities"
        height={300}
        ariaLabel={`خريطة موقع ${facility.name_ar}`}
      />
      <a
        className="btn btn--ghost btn--block"
        href={directions}
        target="_blank"
        rel="noopener noreferrer"
      >
        <NavigationIcon />
        فتح الاتجاهات في خرائط جوجل
      </a>

      {facility.notes ? (
        <div className="notice">
          <InfoIcon />
          <span>
            <strong>ملاحظات: </strong>
            {facility.notes}
          </span>
        </div>
      ) : null}

      <div className="verified-note">
        <InfoIcon />
        <span>
          {facility.verified
            ? "تم التحقق من بيانات هذه المنشأة ميدانياً."
            : "بيانات هذه المنشأة غير موثّقة ميدانياً بعد، وقد تكون تغيّرت. يُرجى الاتصال قبل التوجه."}
          {facility.source ? (
            <>
              <br />
              <span className="tiny">المصدر: {facility.source}</span>
            </>
          ) : null}
          {facility.last_update ? (
            <>
              <br />
              <span className="tiny">آخر تحديث: {facility.last_update}</span>
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}
