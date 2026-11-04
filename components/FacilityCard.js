import Link from "next/link";
import { PhoneIcon, PinIcon, AlertIcon, ChevronLeftIcon } from "@/components/Icons";
import { formatDistance } from "@/lib/geo";

export function phoneHref(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : null;
}

export default function FacilityCard({ facility }) {
  const href = `/facility/?id=${facility.id}`;
  const distance =
    facility.distance != null ? formatDistance(facility.distance) : null;
  const tel = phoneHref(facility.phone);

  return (
    <article className="f-card">
      <Link
        href={href}
        className="f-card__link"
        aria-label={`عرض تفاصيل ${facility.name_ar}`}
        prefetch={false}
      />
      <div className="f-card__top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="f-card__title">{facility.name_ar}</h3>
          <p className="f-card__type">{facility.type}</p>
        </div>
      </div>

      <div className="badges">
        {distance ? (
          <span className="badge badge--distance">
            <PinIcon />
            {distance}
          </span>
        ) : null}
        {facility.emergency ? (
          <span className="badge badge--emergency">
            <AlertIcon />
            طوارئ
          </span>
        ) : null}
        {facility.services?.length ? (
          <span className="badge">{facility.services[0]}</span>
        ) : null}
      </div>

      <p className="f-card__addr">
        <PinIcon />
        <span>{facility.address || facility.landmark || "محافظة الفيوم"}</span>
      </p>

      <div className="f-card__foot">
        <span className="f-card__more">
          التفاصيل
          <ChevronLeftIcon />
        </span>
        {tel ? (
          <a className="call-btn" href={tel} aria-label={`اتصال بـ ${facility.name_ar}`}>
            <PhoneIcon />
            اتصال
          </a>
        ) : (
          <span className="badge">بدون رقم</span>
        )}
      </div>
    </article>
  );
}
