// owner/edit-ad/[id].tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Loader2,
  AlertCircle,
  Eye
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
interface Ad {
  id: number;
  title: string;
  content: string;
  bannerType: string;
  startAt: string;
  endAt: string;
  ctaText?: string;
  ctaUrl?: string;
  url?: string;
  backgroundColor?: string;
  textColor?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  tabletImageUrl?: string;
  status?: string;
  rejectionReason?: string;
}


export default function EditAdPage() {
  const router = useRouter();
  const params = useParams<{id:string}>();
  const id = params.id;
  
  const user = useSelector((state: RootState) => state.user.user) as StoreUser | null;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    bannerType: "MAIN_HERO",
    startAt: "",
    endAt: "",
    ctaText: "",
    ctaUrl: "",
    url: "",
    backgroundColor: "#ffffff",
    textColor: "#000000"
  });
  
  const [existingImages, setExistingImages] = useState({
    image: "",
    mobileImage: "",
    tabletImage: ""
  });
  
  const [newImages, setNewImages] = useState({
    image: null as File | null,
    mobileImage: null as File | null,
    tabletImage: null as File | null
  });
  
  const [previews, setPreviews] = useState({
    image: "",
    mobileImage: "",
    tabletImage: ""
  });
  
  const [token, setToken] = useState<string | null>(null);
  const [adData, setAdData] = useState<Ad | null>(null);

  useEffect(() => {
    setIsClient(true);
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (isClient && (!user || user.role !== "OWNER")) {
      router.push("/");
    }
  }, [user, router, isClient]);

  useEffect(() => {
    if (token && id) {
      fetchAdData();
    }
  }, [token, id]);

  const fetchAdData = async () => {
    try {
      setFetching(true);
      const res = await Axios({
        ...SummaryApi.ad.get_ad_by_id(id),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && res.data.ad) {
        const ad = res.data.ad;
        setAdData(ad);
        
        // تعبئة النموذج بالبيانات
        setFormData({
          title: ad.title || "",
          content: ad.content || "",
          bannerType: ad.bannerType || "MAIN_HERO",
          startAt: ad.startAt ? new Date(ad.startAt).toISOString().slice(0, 16) : "",
          endAt: ad.endAt ? new Date(ad.endAt).toISOString().slice(0, 16) : "",
          ctaText: ad.ctaText || "",
          ctaUrl: ad.ctaUrl || "",
          url: ad.url || "",
          backgroundColor: ad.backgroundColor || "#ffffff",
          textColor: ad.textColor || "#000000"
        });
        
        // حفظ الصور الحالية
        setExistingImages({
          image: ad.imageUrl || "",
          mobileImage: ad.mobileImageUrl || "",
          tabletImage: ad.tabletImageUrl || ""
        });
        
        setPreviews({
          image: ad.imageUrl || "",
          mobileImage: ad.mobileImageUrl || "",
          tabletImage: ad.tabletImageUrl || ""
        });
      }
    } catch (error: any) {
      console.error("Error fetching ad:", error);
      toast.error(error.response?.data?.message || "فشل في تحميل بيانات الإعلان");
      router.push("/Owner");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof newImages) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 5MB");
      return;
    }

    setNewImages(prev => ({ ...prev, [type]: file }));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews(prev => ({ ...prev, [type]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type: keyof typeof newImages) => {
    setNewImages(prev => ({ ...prev, [type]: null }));
    setPreviews(prev => ({ 
      ...prev, 
      [type]: existingImages[type as keyof typeof existingImages] 
    }));
  };

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

    if (!previews.image) {
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

      // إضافة الصور الجديدة فقط إذا تم تحميلها
      if (newImages.image) formDataToSend.append("image", newImages.image);
      if (newImages.mobileImage) formDataToSend.append("mobileImage", newImages.mobileImage);
      if (newImages.tabletImage) formDataToSend.append("tabletImage", newImages.tabletImage);
      const res= await Axios({
        ...SummaryApi.ad.update_ad,
        data: formDataToSend,
        headers:{
          Authorization: `Bearer ${token}`,
        }
      })

      if (res.data.ok) {
        toast.success("تم تحديث الإعلان بنجاح وتم إرساله للمراجعة");
        router.push("/OwnerAds");
      } else {
        toast.error(res.data.message || "حدث خطأ أثناء تحديث الإعلان");
      }
    } catch (err: any) {
      console.error("Update ad error:", err);
      toast.error(err.response?.data?.message || "فشل في تحديث الإعلان");
    } finally {
      setLoading(false);
    }
  };

  if (!isClient || fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "OWNER") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 font-cairo" dir="rtl">
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
                onClick={() => router.push("/Owner")}
                className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  تعديل الإعلان
                </h1>
                <p className="text-gray-600 mt-1">تعديل الإعلان وإعادة إرساله للمراجعة</p>
              </div>
            </div>
            
            {adData?.status === "REJECTED" && adData?.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">سبب الرفض السابق:</h4>
                    <p className="text-red-700 text-sm">{adData.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}
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

                <div className="space-y-4">
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

                  <div>
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
                    <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                      <Image className="w-4 h-4 inline ml-1" />
                      صورة سطح المكتب *
                    </label>
                    
                    <div className="relative">
                      <img
                        src={previews.image || "/placeholder-image.jpg"}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {previews.image && (
                        <button
                          type="button"
                          onClick={() => removeImage("image")}
                          className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <label
                      htmlFor="edit-desktop-image-upload"
                      className="block text-center py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Upload className="w-5 h-5 inline ml-1" />
                      تغيير الصورة
                    </label>
                    <input
                      type="file"
                      id="edit-desktop-image-upload"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "image")}
                      className="hidden"
                    />
                  </div>

                  {/* صورة الجوال */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                      <Smartphone className="w-4 h-4 inline ml-1" />
                      صورة الجوال (اختياري)
                    </label>
                    
                    <div className="relative">
                      <img
                        src={previews.mobileImage || "/placeholder-image.jpg"}
                        alt="Mobile Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {previews.mobileImage && (
                        <button
                          type="button"
                          onClick={() => removeImage("mobileImage")}
                          className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <label
                      htmlFor="edit-mobile-image-upload"
                      className="block text-center py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Upload className="w-5 h-5 inline ml-1" />
                      تغيير الصورة
                    </label>
                    <input
                      type="file"
                      id="edit-mobile-image-upload"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "mobileImage")}
                      className="hidden"
                    />
                  </div>

                  {/* صورة التابلت */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                      <Tablet className="w-4 h-4 inline ml-1" />
                      صورة التابلت (اختياري)
                    </label>
                    
                    <div className="relative">
                      <img
                        src={previews.tabletImage || "/placeholder-image.jpg"}
                        alt="Tablet Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {previews.tabletImage && (
                        <button
                          type="button"
                          onClick={() => removeImage("tabletImage")}
                          className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <label
                      htmlFor="edit-tablet-image-upload"
                      className="block text-center py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Upload className="w-5 h-5 inline ml-1" />
                      تغيير الصورة
                    </label>
                    <input
                      type="file"
                      id="edit-tablet-image-upload"
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

              {/* القسم 4: الألوان */}
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

              {/* ملاحظة */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">ملاحظة مهمة:</h4>
                    <p className="text-blue-700 text-sm">
                      بعد التعديل، سيتم إرسال الإعلان للمراجعة مرة أخرى من قبل فريق الإدارة.
                      سيتغير حالته إلى "قيد المراجعة" حتى تتم الموافقة عليه.
                    </p>
                  </div>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push("/Owner")}
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
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      حفظ التعديلات
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