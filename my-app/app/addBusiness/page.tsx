"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import Axios from "../utilts/Axios";
import SummaryApi from "../common/SummaryApi";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building,
  Phone,
  Clock,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  MapPin,
} from "lucide-react";
import Image from "next/image";

interface OpeningHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

interface FormData {
  name: string;
  description: string;
  categoryId: string;
  tags: string;
  address: string;
  city: string;
  region: string;
  phone: string;
  mobile: string;
  website: string;
  openingHours: OpeningHours;
  featured?: boolean;
}

interface ImageFile {
  file: File;
  preview: string;
}

// المدن الرئيسية في اليمن
const CITIES = [
  "صنعاء",
  "عدن", 
  "تعز",
  "الحديدة",
  "إب",
  "ذمار",
  "المكلا",
  "سيئون",
  "مأرب",
  "صعدة",
  "حجة",
  "ريمة",
  "البيضاء",
  "أبين",
  "لحج",
  "الضالع",
  "عمران",
  "الجوف",
  "المهرة",
  "سقطرى"
];

// المناطق والأحياء داخل المدن (مثال لصنعاء)
const REGIONS_BY_CITY: Record<string, string[]> = {
  "صنعاء": [
    "أمانة العاصمة",
    "مدينة السبعين",
    "حي الصافية",
    "حي المعافر",
    "حي التحرير",
    "حي الزهرة",
    "حي الوحدة",
    "حي بني الحارث",
    "حي الشعبي",
    "حي الثورة"
  ],
  "عدن": [
    "كريتر",
    "المعلا",
    "التواهي",
    "خور مكسر",
    "الشيخ عثمان",
    "المنصورة",
    "دار سعد",
    "البريقة"
  ],
  "تعز": [
    "المدينة",
    "المظفر",
    "صالة",
    "شرعب",
    "مقبنة",
    "المواسط",
    "جبلة",
    "المعافر"
  ],
  "الحديدة": [
    "الميناء",
    "الحالي",
    "الحوك",
    "التحيتا",
    "باجل",
    "الزهرة",
    "المنيرة"
  ],
  "إب": [
    "المدينة",
    "الظهار",
    "السبرة",
    "العدين",
    "النادرة",
    "يريم",
    "السياني",
    "ذي السفال"
  ],
  "المكلا": [
    "الواجهة البحرية",
    "المدينة",
    "الغويز",
    "ريدة",
    "ثبان",
    "العيص"
  ],
  "مأرب": [
    "المدينة",
    "البدع",
    "مدغل",
    "مجزر",
    "رحبة"
  ],
  "صعدة": [
    "المدينة",
    "الظاهر",
    "رازح",
    "قطابر",
    "سحار"
  ],
  "حجة": [
    "المدينة",
    "كحلان",
    "أفلح الشام",
    "المغربة",
    "المستباء"
  ],
  "ذمار": [
    "المدينة",
    "الحداء",
    "عنس",
    "جهران",
    "المنار"
  ]
};

// إذا لم تكن المدينة في القائمة، نعطي خيارات عامة
const GENERAL_REGIONS = [
  "المنطقة الصناعية",
  "المنطقة التجارية",
  "المركز",
  "الواجهة البحرية",
  "الشارع الرئيسي",
  "المدينة القديمة",
  "المنطقة السكنية",
  "المنطقة التعليمية",
  "المنطقة الحكومية"
];

export default function AddBusiness() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.user);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [images, setImages] = useState<ImageFile[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    categoryId: "",
    tags: "",
    address: "",
    city: "",
    region: "",
    phone: "",
    mobile: "",
    website: "",
    openingHours: {
      sunday: { open: "09:00", close: "17:00", closed: false },
      monday: { open: "09:00", close: "17:00", closed: false },
      tuesday: { open: "09:00", close: "17:00", closed: false },
      wednesday: { open: "09:00", close: "17:00", closed: false },
      thursday: { open: "09:00", close: "17:00", closed: false },
      friday: { open: "09:00", close: "17:00", closed: true },
      saturday: { open: "09:00", close: "17:00", closed: false },
    },
    featured: false,
  });

  const tabs = [
    { id: "basic", label: "المعلومات الأساسية", icon: Building },
    { id: "contact", label: "معلومات الاتصال", icon: Phone },
    { id: "hours", label: "أوقات العمل", icon: Clock },
    { id: "media", label: "الصور", icon: ImageIcon },
  ];

 

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      const newFormData = { ...formData, [name]: value };
      
      // إذا تغيرت المدينة، نضبط المنطقة إلى القيمة الافتراضية
      if (name === 'city') {
        newFormData.region = '';
      }
      
      setFormData(newFormData);
    }
  };

  const handleOpeningHoursChange = (
    day: string,
    field: string,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day as keyof typeof prev.openingHours],
          [field]: value,
        },
      },
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`الصورة ${file.name} كبيرة جداً (الحد الأقصى 5MB)`);
          continue;
        }
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }
    }

    if (images.length + newImages.length > 10) {
      toast.error("يمكنك رفع maximum 10 صور فقط");
      return;
    }

    setImages((prev) => [...prev, ...newImages]);
    e.currentTarget.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("اسم العمل مطلوب");
      setActiveTab("basic");
      return false;
    }
    if (formData.name.trim().length < 2) {
      toast.error("اسم العمل يجب أن يكون أكثر من حرفين");
      setActiveTab("basic");
      return false;
    }
    if (!formData.categoryId) {
      toast.error("التصنيف مطلوب");
      setActiveTab("basic");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("المدينة مطلوبة");
      setActiveTab("contact");
      return false;
    }
    if (!formData.mobile.trim() && !formData.phone.trim()) {
      toast.error("يجب إدخال رقم هاتف واحد على الأقل");
      setActiveTab("contact");
      return false;
    }
    return true;
  };

const handleSubmit = async (e: React.FormEvent) => {
  console.log("🚀 handleSubmit بدأ");
  e.preventDefault();
  if (!validateForm()) return;

  setLoading(true);

  try {
    const submitFormData = new FormData();
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return
    }
    // إرسال الحقول كما يتوقع الباك اند تماماً
    submitFormData.append("ownerId", user.id.toString());
    submitFormData.append("name", formData.name.trim());
    
    // 🔹 الحقول الاختيارية - إرسالها فقط إذا كانت لها قيمة
    if (formData.description.trim()) 
      submitFormData.append("description", formData.description.trim());
    
    if (formData.categoryId) 
      submitFormData.append("categoryId", formData.categoryId);
    
    if (formData.tags) 
      submitFormData.append("tags", formData.tags);
    
    if (formData.address.trim()) 
      submitFormData.append("address", formData.address.trim());
    
    if (formData.city.trim()) 
      submitFormData.append("city", formData.city.trim());
    
    if (formData.region.trim()) 
      submitFormData.append("region", formData.region.trim());
    
    if (formData.phone.trim()) 
      submitFormData.append("phone", formData.phone.trim());
    
    if (formData.mobile.trim()) 
      submitFormData.append("mobile", formData.mobile.trim());
    
    if (formData.website.trim()) 
      submitFormData.append("website", formData.website.trim());
    
    // 🔹 تعديل حقل featured - يجب أن يكون boolean وليس string
    // الباك اند يتوقع: featured: featured || false
    // يعني إذا كان undefined/null سيعتبر false
    if (formData.featured) {
      submitFormData.append("featured", "true");
    }
    // لا ترسل featured إذا كانت false حتى يستخدم الباك اند القيمة الافتراضية

    // 🔹 openingHours - تأكد أنها JSON صالحة
    if (formData.openingHours && Object.keys(formData.openingHours).length > 0) {
      submitFormData.append("openingHours", JSON.stringify(formData.openingHours));
    }

    // 🔹 إضافة الصور - اسم الحقل يجب أن يكون 'images' إذا كان الباك اند يتوقعه
    // أو اسم الحقل الذي يعرفه multer middleware
    images.forEach((image) => {
      submitFormData.append("images", image.file); // أو "files" حسب إعداد multer
    });

    const response = await Axios({
      ...SummaryApi.owner.create_bus,
      data:submitFormData
    });

    if (response.data.ok) {
      toast.success("تم إنشاء العمل بنجاح");
      router.push("/Owner");
    } else {
      toast.error(response.data.message || "حدث خطأ غير متوقع");
    }
  } catch (err: any) {
    console.error("Error creating business:", err);
    
    // 🔹 عرض رسالة الخطأ من الباك اند إذا وجدت
    if (err.response?.data?.message) {
      toast.error(err.response.data.message);
    } else if (err.code === "ERR_NETWORK") {
      toast.error("تعذر الاتصال بالخادم");
    } else {
      toast.error("حدث خطأ أثناء إنشاء العمل");
    }
  } finally {
    setLoading(false);
  }
};



 const nextTab = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault(); // مهم هنا
  setActiveTab((prev) => {
    if (prev === "basic") return "contact";
    if (prev === "contact") return "hours";
    if (prev === "hours") return "media";
    return prev;
  });
};

  const prevTab = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
  };

  // الحصول على المناطق المتاحة للمدينة المختارة
  const getAvailableRegions = () => {
    if (!formData.city) return GENERAL_REGIONS;
    return REGIONS_BY_CITY[formData.city] || GENERAL_REGIONS;
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-cairo p-4"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200"
            >
              <ArrowRight className="w-5 h-5 text-gray-700" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
                إضافة عمل جديد
              </h1>
              <p className="text-gray-600 mt-2">
                املأ المعلومات الأساسية عن عملك خطوة بخطوة
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl min-w-max transition-all ${
                  activeTab === tab.id
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.form
          id="business-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}    
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-8"
        >
          <AnimatePresence mode="wait">
            {/* BASIC */}
            {activeTab === "basic" && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">
                  المعلومات الأساسية
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">
                      اسم العمل *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="أدخل اسم العمل..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">
                      التصنيف *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">اختر التصنيف</option>
                      <option value="1">مطاعم</option>
                      <option value="2">مقاهي</option>
                      <option value="3">محلات تجارية</option>
                      <option value="4">خدمات</option>
                      <option value="5">تسوق</option>
                      <option value="6">سياحة</option>
                      <option value="7">صحة وجمال</option>
                      <option value="8">تعليم</option>
                      <option value="9">نقل ومواصلات</option>
                      <option value="10">أخرى</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block font-semibold text-gray-700">
                      وصف العمل
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      rows={4}
                      placeholder="صف عملك بطريقة جذابة..."
                    />
                    <p className="text-xs text-gray-500">
                      يمكنك ذكر المميزات والخدمات التي تقدمها
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block font-semibold text-gray-700">
                      الوسوم *
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="وسوم مفصولة بفواصل: مطعم, وجبات سريعة, عائلي..."
                      required
                    />
                    <p className="text-xs text-gray-500">
                      الوسوم مطلوبة وتساعد في ظهور عملك في نتائج البحث
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CONTACT */}
            {activeTab === "contact" && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">
                  معلومات الاتصال
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="77XXXXXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">
                      الجوال *
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="77XXXXXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">
                      الموقع الإلكتروني
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">
                      المدينة *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">اختر المدينة</option>
                      {CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">
                      المنطقة / الحي
                    </label>
                    <select
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      disabled={!formData.city}
                    >
                      <option value="">اختر المنطقة</option>
                      {getAvailableRegions().map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                    {!formData.city && (
                      <p className="text-xs text-gray-500">
                        اختر المدينة أولاً
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block font-semibold text-gray-700">
                      العنوان التفصيلي
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      rows={3}
                      placeholder="اسم الشارع - رقم المبنى - بجانب... - أي معلومات إضافية تساعد في الوصول إليك"
                    />
                    <p className="text-xs text-gray-500">
                      اكتب العنوان بالتفصيل لتسهيل وصول العملاء إليك
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-blue-700 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    💡 يرجى كتابة العنوان التفصيلي بدقة لتسهيل وصول العملاء إليك
                  </p>
                </div>
              </motion.div>
            )}
            {/* HOURS */}
            {activeTab === "hours" && (
              <motion.div
                key="hours"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">
                  أوقات العمل
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData.openingHours).map(([day, hours]) => (
                    <div
                      key={day}
                      className={`flex items-center gap-4 p-4 rounded-xl ${
                        hours.closed ? "bg-gray-100" : "bg-green-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) =>
                          handleOpeningHoursChange(
                            day,
                            "closed",
                            !e.target.checked
                          )
                        }
                        className="w-5 h-5 text-green-600 focus:ring-green-500"
                      />
                      <span className="w-24 font-medium text-gray-700">
                        {
                          {
                            sunday: "الأحد",
                            monday: "الإثنين",
                            tuesday: "الثلاثاء",
                            wednesday: "الأربعاء",
                            thursday: "الخميس",
                            friday: "الجمعة",
                            saturday: "السبت",
                          }[day]
                        }
                      </span>
                      {!hours.closed ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) =>
                              handleOpeningHoursChange(
                                day,
                                "open",
                                e.target.value
                              )
                            }
                            className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 w-32"
                          />
                          <span className="text-gray-500">إلى</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) =>
                              handleOpeningHoursChange(
                                day,
                                "close",
                                e.target.value
                              )
                            }
                            className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 w-32"
                          />
                        </div>
                      ) : (
                        <span className="text-red-500 font-medium flex-1 text-center">
                          مغلق
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* MEDIA */}
            {activeTab === "media" && (
              <motion.div
                key="media"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">
                  صور العمل
                </h2>

                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-green-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      رفع صور العمل
                    </h3>
                    <p className="text-gray-500 mb-4">
                      اختر الصور التي تريد رفعها لعملك
                    </p>
                    <button
                      type="button"
                      className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
                    >
                      اختر الصور
                    </button>
                    <p className="text-sm text-gray-400 mt-3">
                      الحد الأقصى 10 صور - PNG, JPG, WEBP (الحد الأقصى 5MB
                      للصورة)
                    </p>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
                    {images.map((img, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square border-2 border-gray-200 rounded-xl overflow-hidden group"
                      >
                        <Image
                          src={img.preview}
                          alt={`preview-${idx}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                          <p className="text-white text-xs truncate">
                            {img.file.name}
                          </p>
                          <p className="text-white text-xs">
                            {(img.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

         
        </motion.form>
         {/* Navigation buttons */}
          <div className="flex justify-between pt-6 border-t">
            <motion.button
              type="button"
              onClick={prevTab}
              disabled={activeTab === "basic"}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "basic"
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              }`}
              whileHover={activeTab !== "basic" ? { scale: 1.05 } : {}}
              whileTap={activeTab !== "basic" ? { scale: 0.95 } : {}}
            >
              السابق
            </motion.button>

            {activeTab !== "media" ? (
              <motion.button
                type="button"
                onClick={nextTab}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                التالي
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                form="business-form"
                disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2"
                whileHover={!loading ? { scale: 1.05 } : {}}
                whileTap={!loading ? { scale: 0.95 } : {}}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جارٍ الإرسال...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    إنشاء العمل
                  </>
                )}
              </motion.button>
            )}
          </div>
       
      </div>
    </div>
  );
}