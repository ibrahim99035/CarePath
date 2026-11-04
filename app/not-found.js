import Link from "next/link";

export const metadata = {
  title: "الصفحة غير موجودة",
};

export default function NotFound() {
  return (
    <div className="empty" style={{ paddingTop: 70 }}>
      <div className="big">🧭</div>
      <h1 style={{ fontSize: 21, fontWeight: 800, color: "var(--ink)" }}>
        الصفحة غير موجودة
      </h1>
      <p style={{ marginTop: 8 }}>
        قد يكون الرابط قديماً أو أن المنشأة غير مسجلة في الدليل.
      </p>
      <div style={{ marginTop: 20 }}>
        <Link href="/" className="btn btn--primary">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
