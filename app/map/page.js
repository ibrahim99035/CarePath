import MapScreen from "@/components/MapScreen";

export const metadata = {
  title: "الخريطة",
  description: "خريطة منشآت محافظة الفيوم مع حدود المراكز وموقعك الحالي.",
};

export default function MapPage() {
  return <MapScreen />;
}
