import Link from "next/link";
import { PhoneIcon, PinIcon, AlertIcon } from "@/components/Icons";
import { formatDistance } from "@/lib/geo";
import { phoneHref } from "@/components/FacilityCard";

export default function FacilityRow({ facility }) {
  const href = `/facility/?id=${facility.id}`;
  const distance =
    facility.distance != null ? formatDistance(facility.distance) : null;
  const tel = phoneHref(facility.phone);

  return (
    <article className="f-row">
      <Link
        href={href}
        className="f-row__link"
        aria-label={`عرض تفاصيل ${facility.name_ar}`}
        prefetch={false}
      />
      <div className="f-row__main">
        <h3 className="f-row__title">{facility.name_ar}</h3>
        <p className="f-row__meta">
          <span>{facility.type}</span>
        </p>
        {facility.address ? (
          <p className="f-row__meta">
            <PinIcon />
            <span>{facility.address}</span>
          </p>
        ) : null}
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
        </div>
      </div>
      <div className="f-row__side">
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
