"use client";

import { PinIcon } from "@/components/Icons";

export default function LocationPrompt({ status, fromCache, onRequest }) {
  if (status === "locating") {
    return (
      <div className="location" role="status">
        <span className="location__icon">
          <PinIcon />
        </span>
        <div className="location__text">
          <strong>جارٍ تحديد موقعك…</strong>
          قد يطلب المتصفح السماح بالوصول إلى الموقع.
        </div>
        <span className="loader" aria-hidden="true" />
      </div>
    );
  }

  if (status === "granted") {
    return (
      <div className="location is-ok" role="status">
        <span className="location__icon">
          <PinIcon />
        </span>
        <div className="location__text">
          <strong>تم تحديد موقعك</strong>
          {fromCache
            ? "نستخدم آخر موقع محفوظ لحساب المسافة."
            : "المنشآت مرتبة من الأقرب إلى الأبعد."}
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="location">
        <span className="location__icon">
          <PinIcon />
        </span>
        <div className="location__text">
          <strong>لم يتم السماح بالموقع</strong>
          يمكنك التصفح بدون مسافة. يمكنك المحاولة مرة أخرى من إعدادات المتصفح.
        </div>
        <button type="button" className="btn btn--ghost" onClick={onRequest}>
          المحاولة
        </button>
      </div>
    );
  }

  if (status === "error" || status === "unavailable") {
    return (
      <div className="location">
        <span className="location__icon">
          <PinIcon />
        </span>
        <div className="location__text">
          <strong>تعذّر تحديد الموقع</strong>
          استمر في التصفح؛ سيتم عرض المنشآت بدون ترتيب حسب المسافة.
        </div>
      </div>
    );
  }

  return (
    <div className="location">
      <span className="location__icon">
        <PinIcon />
      </span>
      <div className="location__text">
        <strong>اعرف الأقرب إليك</strong>
        اسمح بالوصول لموقعك لحساب المسافة وترتيب المنشآت.
      </div>
      <button type="button" className="btn btn--soft" onClick={onRequest}>
        استخدم موقعي
      </button>
    </div>
  );
}
