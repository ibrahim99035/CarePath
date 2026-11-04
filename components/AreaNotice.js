"use client";

import { formatDistance } from "@/lib/geo";
import { AlertIcon, NavigationIcon, PinIcon } from "@/components/Icons";

const NEARBY_HOSPITALS =
  "https://www.google.com/maps/search/?api=1&query=hospital+near+me";

export default function AreaNotice({ area, emergency = false }) {
  if (!area || area.status === "loading" || area.status === "unknown") {
    return null;
  }

  if (area.status === "inside" && !area.approximate) return null;

  if (area.status === "inside" && area.approximate) {
    return (
      <div className="area-notice area-notice--muted" role="status">
        <PinIcon />
        <div>
          <strong>دقة الموقع منخفضة</strong>
          <p>
            دقة موقعك الحالي ±{formatDistance((area.accuracyM || 0) / 1000)}،
            لذلك قد تكون المسافات المعروضة تقديرية.
          </p>
        </div>
      </div>
    );
  }

  if (area.status === "near") {
    return (
      <div className="area-notice area-notice--warn" role="status">
        <PinIcon />
        <div>
          <strong>موقعك قريب من حدود محافظة الفيوم</strong>
          <p>
            {area.distanceKm != null
              ? `يبعد موقعك نحو ${formatDistance(area.distanceKm)} عن أقرب حدود للمحافظة. `
              : ""}
            قد تكون بعض المنشآت أبعد من المسافة المعروضة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="area-notice area-notice--outside" role="alert">
      <AlertIcon />
      <div>
        <strong>موقعك خارج محافظة الفيوم</strong>
        <p>
          {area.distanceKm != null
            ? `يبعد موقعك نحو ${formatDistance(area.distanceKm)} عن حدود المحافظة. `
            : ""}
          المسافات المعروضة محسوبة من موقعك الحالي، وقد تكون منشآت الفيوم بعيدة
          عنك.
        </p>
        {emergency ? (
          <a
            className="area-notice__action"
            href={NEARBY_HOSPITALS}
            target="_blank"
            rel="noopener noreferrer"
          >
            <NavigationIcon />
            ابحث عن أقرب مستشفى حولي
          </a>
        ) : null}
      </div>
    </div>
  );
}
