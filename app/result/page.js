import { Suspense } from "react";
import ResultView from "@/components/ResultView";

export const metadata = {
  title: "نتيجة التوجيه",
};

function ResultFallback() {
  return (
    <div className="empty">
      <div className="loader" style={{ margin: "0 auto 14px" }} />
      جارٍ تجهيز النتيجة…
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<ResultFallback />}>
      <ResultView />
    </Suspense>
  );
}
