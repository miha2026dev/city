import L from "leaflet";
import "leaflet/dist/leaflet.css";

// تهيئة Leaflet في بيئة المتصفح فقط
export function initializeLeaflet() {
  if (typeof window === "undefined") return null;

  // إصلاح مسار الأيقونات الافتراضية
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });

  return L;
}

// أيقونة مخصصة
export function createCustomIcon() {
  return L.divIcon({
    html: `
      <div style="
        background: #10b981;
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          text-align: center;
          line-height: 24px;
          font-size: 14px;
        ">📍</div>
      </div>
    `,
    className: "custom-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}
