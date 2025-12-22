// تعريف مصادر الطبقات
export const mapLayers = {

  street: {
    name: "الخريطة العادية",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a', 'b', 'c'] // نطاقات فرعيه لتسريع التحميل 
  },
  //طبقة القمر الصناعي
  satellite: {
    name: "القمر الصناعي",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    subdomains: [] // أو ['server'] أو أضف مصفوفة فارغة
  },
  //طبقة الهجين
  hybrid: {
    name: "هجين",
    url: "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
    attribution: '&copy; Google',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  }
};

export const defaultCenter = [13.9510, 44.9636]; // =

// دالة مساعدة لإنشاء أيقونة مخصصة
export const getCustomIconConfig = () => ({
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
  className: 'custom-marker',
  iconSize: [30, 30] as [number, number],
  iconAnchor: [15, 30] as [number, number]
});