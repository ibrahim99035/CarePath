import Link from "next/link";
import {
  CrossIcon,
  HospitalIcon,
  MapIcon,
  SparkIcon,
  RouteIcon,
  WifiOffIcon,
  InfoIcon,
} from "@/components/Icons";
import { facilityCounts } from "@/lib/facilities";

export default function HomePage() {
  const { total } = facilityCounts();

  return (
    <div className="stack">
      <header className="brand">
        <span className="brand-mark" aria-hidden="true">
          <CrossIcon />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="brand-name">دليلتي الصحية</div>
          <div className="brand-sub">الفيوم · CarePath</div>
        </div>
        <span className="pill pill--ok">
          <WifiOffIcon />
          يعمل دون إنترنت
        </span>
      </header>

      <section className="hero">
        <span className="hero-eyebrow">
          <SparkIcon />
          توجيه صحي بسيط
        </span>
        <h1>أين أذهب عندما أشتكي؟</h1>
        <p>
          أجب عن أسئلة قليلة لنحدد مستوى الرعاية المناسب، ثم نعرض أقرب المنشآت
          الصحية في محافظة الفيوم.
        </p>
        <Link href="/guide/" className="btn btn--white btn--lg">
          <RouteIcon />
          ابدأ التوجيه
        </Link>
      </section>

      <div className="action-grid">
        <Link href="/facilities/" className="action">
          <span className="action-icon">
            <HospitalIcon />
          </span>
          <strong>تصفح المنشآت</strong>
          <span>{total.toLocaleString("ar-EG")} منشأة صحية في الفيوم</span>
        </Link>
        <Link href="/emergency/" className="action action--danger">
          <span className="action-icon">
            <CrossIcon />
          </span>
          <strong>حالة طارئة</strong>
          <span>علامات الخطر وأقرب مستشفى طوارئ</span>
        </Link>
        <Link href="/map/" className="action action--wide">
          <span className="action-icon">
            <MapIcon />
          </span>
          <strong>الخريطة التفاعلية</strong>
          <span>حدود المراكز، موقعك الحالي، وكل المنشآت على خريطة واحدة</span>
        </Link>
      </div>

      <div className="section-head">
        <h2>كيف يعمل؟</h2>
      </div>
      <div className="card steps">
        <div className="step">
          <span className="step-num">١</span>
          <div>
            <strong>أجب بلمسة واحدة</strong>
            <p>اختر الفئة العمرية والشكوى الرئيسية دون كتابة أي شيء.</p>
          </div>
        </div>
        <div className="step">
          <span className="step-num">٢</span>
          <div>
            <strong>نحدد مستوى الرعاية</strong>
            <p>إذا وُجدت علامة خطرة، ينتقل التطبيق فوراً إلى شاشة الطوارئ.</p>
          </div>
        </div>
        <div className="step">
          <span className="step-num">٣</span>
          <div>
            <strong>نعرض الأقرب إليك</strong>
            <p>بعد السماح بالموقع، نرتّب المنشآت المناسبة من الأقرب إلى الأبعد.</p>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>مهم أن تعرف</h2>
      </div>
      <div className="notice">
        <InfoIcon />
        <span>
          هذا التطبيق إرشادي ولا يغني عن استشارة الطبيب. في الحالات الحرجة اتصل
          بالإسعاف على <strong>123</strong> فوراً. بيانات المنشآت قيد التحقق
          الميداني؛ يُفضّل الاتصال قبل التوجه.
        </span>
      </div>
    </div>
  );
}
