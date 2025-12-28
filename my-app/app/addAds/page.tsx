"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import Axios from "../utilts/Axios";
import SummaryApi from "../common/SummaryApi";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X,
  Calendar,
  Image,
  Smartphone,
  Tablet,
  Globe,
  Store,
  Type,
  FileText,
  Palette,
  Megaphone,
  Loader2,
  Shield
} from "lucide-react";

interface StoreUser {
  id: number;
  name?: string;
  username: string;
  role: "ADMIN" | "OWNER";
  accessToken: string;
}

interface Business {
  id: number;
  name: string;
}

export default function CreateAdPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.user) as StoreUser | null;
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [fetchingBusinesses, setFetchingBusinesses] = useState(false);
  const initialFormData = {
  title: "",
  content: "",
  bannerType: "MAIN_HERO",
  targetType: user?.role === "ADMIN" ? "EXTERNAL" : "BUSINESS",
  targetId: "",
  startAt: "",
  endAt: "",
  ctaText: "",
  ctaUrl: "",
  url: "",
  backgroundColor: "#ffffff",
  textColor: "#000000"
};
const initialImages = {
  image: null as File | null,
  mobileImage: null as File | null,
  tabletImage: null as File | null
};
  // حالة النموذج
  const [formData, setFormData] = useState<typeof initialFormData>(initialFormData);
  const [images, setImages] = useState(initialImages);
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [businessesError, setBusinessesError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    // الحصول على التوكن من localStorage فقط على العميل
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    setToken(storedToken);
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!token) return;
      
      setFetchingBusinesses(true);
      setBusinessesError(null);
      
      try {
        const res = await Axios({
          ...SummaryApi.owner.get_bus,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // تأكد من أن البيانات موجودة ولها الهيكل الصحيح
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          setBusinesses(res.data.data);
        } else {
          setBusinesses([]);
          setBusinessesError("لا توجد متاجر متاحة حالياً");
        }
      } catch (error: any) {
        console.error("فشل جلب المتاجر", error);
        setBusinesses([]);
        setBusinessesError(error.response?.data?.message || "فشل في تحميل المتاجر");
      } finally {
        setFetchingBusinesses(false);
      }
    };

    fetchBusinesses();
  }, [token]);

  const [previews, setPreviews] = useState({
    image: "",
    mobileImage: "",
    tabletImage: ""
  });

  // منع الوصول إذا لم يكن المستخدم مسجلاً
  useEffect(() => {
    if (isClient && (!user || !["ADMIN", "OWNER"].includes(user.role))) {
      router.push("/");
    }
  }, [user, router, isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user || !["ADMIN", "OWNER"].includes(user.role)) {
    return null;
  }

  // معالجة تغيير النص
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // معالجة رفع الصور
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof images) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الصورة
    if (!file.type.startsWith('image/')) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }

    // التحقق من حجم الصورة (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 5MB");
      return;
    }

    setImages(prev => ({ ...prev, [type]: file }));
    
    // إنشاء معاينة
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews(prev => ({ ...prev, [type]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // حذف صورة
  const removeImage = (type: keyof typeof images) => {
    setImages(prev => ({ ...prev, [type]: null }));
    setPreviews(prev => ({ ...prev, [type]: "" }));
  };

  // إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startAt || !formData.endAt) {
      toast.error("يرجى ملء الحقول الإلزامية (*)");
      return;
    }

    if (new Date(formData.endAt) <= new Date(formData.startAt)) {
      toast.error("تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء");
      return;
    }

    if (!images.image) {
      toast.error("يرجى تحميل صورة رئيسية للإعلان");
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();

      // إضافة البيانات النصية
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });

      // إضافة الصور
      if (images.image) formDataToSend.append("image", images.image);
      if (images.mobileImage) formDataToSend.append("mobileImage", images.mobileImage);
      if (images.tabletImage) formDataToSend.append("tabletImage", images.tabletImage);

      const res = await Axios({
        ...SummaryApi.ad.create_ad,
        data: formDataToSend,
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });

      if (res.data.ok) {
        toast.success("تم إنشاء الإعلان بنجاح وتم إرساله للمراجعة");
        setFormData(initialFormData)
        setImages(initialImages)
        router.push("/AdminAds");
      } else {
        toast.error(res.data.message || "حدث خطأ أثناء إنشاء الإعلان");
      }
    } catch (err: any) {
      console.error("Create ad error:", err);
      toast.error(err.response?.data?.message || "فشل في إنشاء الإعلان");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 font-cairo"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/AdminAds")}
                className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  إنشاء إعلان جديد
                </h1>
                <p className="text-gray-600 mt-1">أضف إعلاناً جديداً للنظام</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* القسم 1: المعلومات الأساسية */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  <Type className="w-5 h-5 inline ml-2" />
                  المعلومات الأساسية
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان الإعلان *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="أدخل عنوان الإعلان"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع البانر *
                    </label>
                    <select
                      name="bannerType"
                      value={formData.bannerType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="MAIN_HERO">بانر رئيسي</option>
                      <option value="SIDE_BAR">شريط جانبي</option>
                      <option value="POPUP">نافذة منبثقة</option>
                    </select>
                  </div>

                  {user?.role === "OWNER" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اختر المتجر *
                      </label>
                      <select
                        name="targetId"
                        value={formData.targetId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                      >
                        <option value="">اختر المتجر</option>
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {user?.role === "ADMIN" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نوع الإعلان *
                      </label>
                      <select
                        name="targetType"
                        value={formData.targetType}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                      >
                        <option value="EXTERNAL">إعلان خارجي عام</option>
                        <option value="BUSINESS">إعلان لمتجر</option>
                        <option value="LISTING">إعلان لقائمة</option>
                        <option value="CATEGORY">إعلان لفئة</option>
                      </select>
                    </div>
                  )}

                  {(formData.targetType === "BUSINESS" ||
                    user?.role === "OWNER") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اختر المتجر *
                      </label>
                      <select
                        name="targetId"
                        value={formData.targetId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                      >
                        <option value="">اختر المتجر</option>
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      محتوى الإعلان *
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="أدخل محتوى الإعلان..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* القسم 2: الصور */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  <Image className="w-5 h-5 inline ml-2" />
                  صور الإعلان
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* صورة سطح المكتب */}
                  <div className="space-y-2">
                    <label
                      htmlFor="desktop-image-upload"
                      className="block text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      <Image className="w-4 h-4 inline ml-1" />
                      صورة سطح المكتب *
                    </label>

                    {previews.image ? (
                      <div className="relative">
                        <img
                          src={previews.image}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage("image")}
                          className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="desktop-image-upload" // ⬅️ تغيير هنا
                        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-700 font-medium">
                          اختر صورة للإعلان
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          انقر هنا أو اسحب الصورة
                        </p>
                      </label>
                    )}

                    <input
                      type="file"
                      id="desktop-image-upload" // ⬅️ تغيير هنا
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "image")}
                      className="hidden"
                    />
                  </div>

                  {/* صورة الجوال */}
                  <div className="space-y-2">
                    <label
                      htmlFor="mobile-image-upload"
                      className="block text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      {" "}
                      {/* ⬅️ ID مختلف */}
                      <Smartphone className="w-4 h-4 inline ml-1" />
                      صورة الجوال (اختياري)
                    </label>

                    {previews.mobileImage ? (
                      <div className="relative">
                        <img
                          src={previews.mobileImage}
                          alt="Mobile Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage("mobileImage")}
                          className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="mobile-image-upload" // ⬅️ ID مختلف
                        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-700 font-medium">
                          اختر صورة للجوال
                        </p>
                        <p className="text-sm text-gray-500 mt-1">(اختياري)</p>
                      </label>
                    )}

                    <input
                      type="file"
                      id="mobile-image-upload" // ⬅️ ID مختلف
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "mobileImage")}
                      className="hidden"
                    />
                  </div>

                  {/* صورة التابلت */}
                  <div className="space-y-2">
                    <label
                      htmlFor="tablet-image-upload"
                      className="block text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      {" "}
                      {/* ⬅️ ID مختلف */}
                      <Tablet className="w-4 h-4 inline ml-1" />
                      صورة التابلت (اختياري)
                    </label>

                    {previews.tabletImage ? (
                      <div className="relative">
                        <img
                          src={previews.tabletImage}
                          alt="Tablet Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage("tabletImage")}
                          className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="tablet-image-upload" // ⬅️ ID مختلف
                        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-700 font-medium">
                          اختر صورة للتابلت
                        </p>
                        <p className="text-sm text-gray-500 mt-1">(اختياري)</p>
                      </label>
                    )}

                    <input
                      type="file"
                      id="tablet-image-upload" // ⬅️ ID مختلف
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "tabletImage")}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* القسم 3: التواريخ */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  <Calendar className="w-5 h-5 inline ml-2" />
                  الجدول الزمني
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاريخ البدء *
                    </label>
                    <input
                      type="datetime-local"
                      name="startAt"
                      value={formData.startAt}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاريخ الانتهاء *
                    </label>
                    <input
                      type="datetime-local"
                      name="endAt"
                      value={formData.endAt}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* القسم 4: الألوان والإجراءات */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  <Palette className="w-5 h-5 inline ml-2" />
                  التخصيص
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      لون الخلفية
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="backgroundColor"
                        value={formData.backgroundColor}
                        onChange={handleChange}
                        className="w-12 h-12 cursor-pointer"
                      />
                      <input
                        type="text"
                        name="backgroundColor"
                        value={formData.backgroundColor}
                        onChange={handleChange}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      لون النص
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="textColor"
                        value={formData.textColor}
                        onChange={handleChange}
                        className="w-12 h-12 cursor-pointer"
                      />
                      <input
                        type="text"
                        name="textColor"
                        value={formData.textColor}
                        onChange={handleChange}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* القسم 5: روابط */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  <Globe className="w-5 h-5 inline ml-2" />
                  الروابط
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نص زر الإجراء
                    </label>
                    <input
                      type="text"
                      name="ctaText"
                      value={formData.ctaText}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="مثال: تسوق الآن"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رابط زر الإجراء
                    </label>
                    <input
                      type="url"
                      name="ctaUrl"
                      value={formData.ctaUrl}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رابط الإعلان (اختياري)
                    </label>
                    <input
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push("/AdminAds")}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      إنشاء الإعلان
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}