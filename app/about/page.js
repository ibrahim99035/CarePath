import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  CrossIcon,
  ShieldIcon,
  InfoIcon,
  PinIcon,
} from "@/components/Icons";
export const metadata = {
  title: "عن التطبيق",
};

export default function AboutPage() {
  return (
    <div className="stack">
      <PageHeader title="عن التطبيق" sub="دليلتي الصحية · CarePath" backHref="/" />

      <section className="card">
        <div className="brand" style={{ padding: 0, marginBottom: 14 }}>
          <span className="brand-mark" aria-hidden="true">
            <CrossIcon />
          </span>
          <div>
            <div className="brand-name">دليلتي الصحية</div>
            <div className="brand-sub">نسخة تجريبية — محافظة الفيوم</div>
          </div>
        </div>
        <p className="about-p">
          تطبيق إرشادي بسيط يساعد الأسر في الفيوم على معرفة مستوى الرعاية المناسب
          وأقرب المنشآت الصحية، دون حساب أو تسجيل، ويعمل دون إنترنت بعد أول زيارة.
        </p>
        <p className="about-p">
          أجب عن أسئلة قليلة بلمسة واحدة، وسيحدد التطبيق إن كانت الحالة طارئة أم
          تحتاج رعاية عاجلة أو أساسية أو تخصصية، ثم يعرض المنشآت الأنسب والأقرب.
        </p>
      </section>

      <section className="card">
        <div className="kv">
          <span>النطاق الجغرافي</span>
          <span>محافظة الفيوم</span>
        </div>
        <div className="kv">
          <span>عدد المنشآت</span>
          <span>140 منشأة صحية</span>
        </div>
        <div className="kv">
          <span>اللغة</span>
          <span>العربية (من اليمين لليسار)</span>
        </div>
        <div className="kv">
          <span>الإصدار</span>
          <span>1.0.0 — تجريبي</span>
        </div>
        <div className="kv">
          <span>يعمل دون إنترنت</span>
          <span>نعم، بعد أول تحميل</span>
        </div>
      </section>

      <div className="section-head" style={{ marginTop: 2 }}>
        <h2>الخصوصية</h2>
      </div>
      <div className="notice">
        <ShieldIcon />
        <span>
          لا توجد حسابات ولا خادم. لا نرسل بياناتك إلى أي جهة. موقعك يُستخدم فقط
          داخل جهازك لحساب المسافة، ويُحفظ محلياً لمدة قصيرة لتسريع الاستخدام.
        </span>
      </div>

      <div className="section-head" style={{ marginTop: 2 }}>
        <h2>مصادر البيانات</h2>
      </div>
      <section className="card">
        <p className="about-p">
          جُمعت بيانات المنشآت من مصادر عامة، منها وزارة الصحة والسكان (منظومة
          100 مليون صحة)، وأدلة محلية للمستشفيات، وOpenStreetMap وHealthsites.io،
          مع مراجعة صفحات رسمية حيث توفرت.
        </p>
        <p className="about-p">
          جميع السجلات حالياً <strong>غير موثّقة ميدانياً</strong>، وقد تحتوي
          أرقاماً قديمة أو عناوين تقريبية. يُرجى الاتصال بالمنشأة قبل التوجه.
        </p>
        <p className="about-p">
          تُستخدم حدود محافظة الفيوم ومراكزها من بيانات
          <strong> geoBoundaries </strong>
          (OCHA ROMENA / CAPMAS، رخصة CC BY 3.0 IGO) لتحديد ما إذا كان موقعك
          داخل المحافظة، وخريطة الأساس من
          <strong> OpenStreetMap </strong>
          (رخصة ODbL). تعمل حدود المحافظة والمنشآت دون إنترنت، أما بلاطات
          الخريطة فتحتاج اتصالاً.
        </p>
      </section>

      <div className="section-head" style={{ marginTop: 2 }}>
        <h2>تنبيه مهم</h2>
      </div>
      <div className="verified-note">
        <InfoIcon />
        <span>
          هذا التطبيق لا يقدم تشخيصاً أو علاجاً، ولا يغني عن استشارة الطبيب. في
          الحالات الحرجة اتصل بالإسعاف على <strong>123</strong> فوراً.
        </span>
      </div>

      <div className="stack-sm" style={{ marginTop: 6 }}>
        <Link href="/guide/" className="btn btn--primary btn--block">
          <PinIcon />
          ابدأ التوجيه الصحي
        </Link>
        <Link href="/emergency/" className="btn btn--ghost btn--block">
          <CrossIcon />
          شاشة الطوارئ
        </Link>
      </div>
    </div>
  );
}
