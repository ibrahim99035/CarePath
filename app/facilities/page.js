import FacilitiesBrowser from "@/components/FacilitiesBrowser";

export const metadata = {
  title: "المنشآت الصحية",
  description: "تصفح المنشآت الصحية في محافظة الفيوم وفلترتها حسب النوع والطوارئ.",
};

export default function FacilitiesPage() {
  return <FacilitiesBrowser />;
}
