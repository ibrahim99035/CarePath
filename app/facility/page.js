import { Suspense } from "react";
import FacilityDetails from "@/components/FacilityDetails";

export const metadata = {
  title: "تفاصيل المنشأة",
};

function DetailsFallback() {
  return (
    <div className="empty">
      <div className="loader" style={{ margin: "0 auto 14px" }} />
      جارٍ تحميل البيانات…
    </div>
  );
}

export default function FacilityPage() {
  return (
    <Suspense fallback={<DetailsFallback />}>
      <FacilityDetails />
    </Suspense>
  );
}
