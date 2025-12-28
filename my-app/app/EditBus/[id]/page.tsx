"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import Axios from "@/app/utilts/Axios";
import SummaryApi from "@/app/common/SummaryApi";
import { toast } from "react-hot-toast";
import { 
  Building, Clock, MapPin, Globe, 
  Image as ImageIcon, Save, X, 
  Trash2, Upload, Calendar, Tag,
  Phone, Map, Globe as GlobeIcon
} from "lucide-react";
interface Media {
  id: number;
  url: string;
  publicId?: string;
  type: "IMAGE" | "VIDEO"; // أو أي MediaType تستخدمه
  altText?: string;
  title?: string;
  description?: string;
  order: number;
  businessId?: number;
}
interface Business {
  id: number;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  website?: string;
  openingHours?: Record<string, any>;
  categoryId?: number;
  category?: { id: number; name: string };
  media?: Media[];
}
interface HoursRange {
  open?: string;
  close?: string;
  closed?: boolean;
}





interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
}

export default function EditBusinessPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.user);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
    city: "",
    website: "",
    categoryId: 0,
  });
  
  const [openingHours, setOpeningHours] = useState<Record<string, any>>({});
  const [hoursText, setHoursText] = useState("");

  const [images, setImages] = useState<{
    existing: Array<{ id: number; url: string; type: string }>;
    new: File[];
    removed: number[];
  }>({
    existing: [],
    new: [],
    removed: []
  });
  
  const [imagePreviews, setImagePreviews] = useState<Array<{
    url: string;
    type: 'existing' | 'new';
    id?: number;
    file?: File;
  }>>([]);
  
  const [showHoursEditor, setShowHoursEditor] = useState(false);

  // خريطة الأيام (عربي <-> إنجليزي)
  const dayMap: Record<string, string> = {
    sunday: "الأحد",
    monday: "الاثنين", 
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت"
  };

  // جلب البيانات
  useEffect(() => { 
    if (user && id) {
      fetchData(); 
    }
  }, [id, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // جلب بيانات العمل
      const resBus = await Axios({
        ...SummaryApi.owner.get_bus_by_id(parseInt(id as string)),
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      
      if (!resBus.data.ok) throw new Error(resBus.data.message || "فشل جلب بيانات العمل");

      const busData = resBus.data.data;
      setBusiness(busData);
      
      setFormData({
        name: busData.name || "",
        description: busData.description || "",
        phone: busData.phone || "",
        address: busData.address || "",
        city: busData.city || "",
        website: busData.website?.startsWith("http")
          ? busData.website
          : `https://${busData.website}`,
        categoryId: busData.categoryId || 0,
      });

      // معالجة ساعات العمل - الإصلاح هنا
      if (busData.openingHours) {
        let hoursObj;
        
        // إذا كانت ساعات العمل نص JSON، قم بتحليله
        if (typeof busData.openingHours === 'string') {
          try {
            hoursObj = JSON.parse(busData.openingHours);
          } catch {
            hoursObj = busData.openingHours;
          }
        } else {
          hoursObj = busData.openingHours;
        }
        
        setOpeningHours(hoursObj);
        
        // تحويل إلى نص للعرض
        const hoursArray = Object.entries(hoursObj).map(([dayKey, hours]) => {
          const dayName = dayMap[dayKey] || dayKey;
          
          if (typeof hours === 'string') {
            return `${dayName}: ${hours}`;
          } else if (hours && typeof hours === 'object') {
            const h = hours as HoursRange
          if (h.closed) {
              return `${dayName}: مغلق`;
            } else if (h.open && h.close) {
              return `${dayName}: ${h.open} - ${h.close}`;
            } else if (h.open || h.close) {
              return `${dayName}: ${h.open || ''}${h.open && h.close ? ' - ' : ''}${h.close || ''}`;
            }
          }
          return `${dayName}: غير محدد`;
        });
        
        setHoursText(hoursArray.join('\n'));
      }

      // معالجة الصور
      const existingMedia = busData.media || [];
      setImages(prev => ({
        ...prev,
        existing: existingMedia
      }));
      
      // إنشاء معاينات للصور الحالية
      const previews = existingMedia.map((media: Media) => ({
        url: media.url,
        type: 'existing' as const,
        id: media.id
      }));
      
      setImagePreviews(previews);

      // جلب التصنيفات
      const resCats = await Axios({ 
        ...SummaryApi.category.get_categories
      });
      
      if (resCats.data?.success && Array.isArray(resCats.data.data)) {
        const allCats = resCats.data.data;
        setCategories(allCats);
        
        // تصفية فقط التصنيفات الرئيسية (بدون تصنيفات فرعية)
        const mainCategories = allCats.filter((cat: Category) => cat.parentId === null);
        setFilteredCategories(mainCategories);
      } else {
        setCategories([]);
        setFilteredCategories([]);
      }
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "حدث خطأ أثناء تحميل البيانات");
      router.push("/Owner");
    } finally {
      setLoading(false);
    }
  };

  // تحديث الحقول
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // رفع الصور
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // حساب المساحة المتبقية
    const keptExisting = images.existing.filter(img => !images.removed.includes(img.id)).length;
    const totalImages = keptExisting + images.new.length;
    const remaining = Math.max(0, 10 - totalImages);
    
    if (files.length > remaining) {
      toast.error(`يمكنك إضافة ${remaining} صور فقط (الحد الأقصى 10 صور)`);
      return;
    }
    
    const newFiles = files.slice(0, remaining);
    
    // تحديث حالة الصور الجديدة
    setImages(prev => ({
      ...prev,
      new: [...prev.new, ...newFiles]
    }));
    
    // إنشاء معاينات للصور الجديدة
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImagePreviews(prev => [...prev, {
          url,
          type: 'new',
          file
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };

  // حذف صورة
  const handleRemoveImage = useCallback((index: number) => {
    const preview = imagePreviews[index];
    
    if (preview.type === 'existing' && preview.id) {
      // حذف صورة موجودة
      setImages(prev => ({
        ...prev,
        removed: [...prev.removed, preview.id!]
      }));
    } else if (preview.type === 'new' && preview.file) {
      // حذف صورة جديدة
      setImages(prev => ({
        ...prev,
        new: prev.new.filter(file => file !== preview.file)
      }));
    }
    
    // إزالة من المعاينات
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, [imagePreviews]);

  // معالجة ساعات العمل - الإصلاح الكامل هنا
  const handleHoursChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setHoursText(text);
    
    // تحويل النص إلى كائن منظم
    const newHours: Record<string, any> = {};
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      const match = line.match(/^(.+?):(.+)$/);
      if (match) {
        const arabicDay = match[1].trim();
        const timeStr = match[2].trim();
        
        // تحويل اليوم العربي إلى مفتاح إنجليزي
        const englishDayKey = Object.keys(dayMap).find(
          key => dayMap[key] === arabicDay
        ) || arabicDay.toLowerCase().replace(/\s+/g, '');
        
        if (timeStr.toLowerCase().includes('مغلق')) {
          newHours[englishDayKey] = { closed: true };
        } else {
          const times = timeStr.split('-').map(t => t.trim());
          if (times.length === 2) {
            newHours[englishDayKey] = { 
              open: times[0] || '', 
              close: times[1] || '', 
              closed: false 
            };
          } else if (times.length === 1 && times[0]) {
            newHours[englishDayKey] = times[0];
          } else {
            newHours[englishDayKey] = timeStr;
          }
        }
      }
    });
    
    setOpeningHours(newHours);
  };

  // حفظ التغييرات - الإصلاح هنا
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = new FormData();
      
      // البيانات الأساسية
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, String(value));
      });
      
      // ساعات العمل - تأكد من إرسالها بشكل صحيح
      if (Object.keys(openingHours).length > 0) {
        data.append('openingHours', JSON.stringify(openingHours));
      }
      
      // الصور الجديدة
      images.new.forEach(file => {
        data.append('images', file);
      });
      
      // الصور المحذوفة
      images.removed.forEach(id => {
        data.append('removeImages', id.toString());
      });
      
      const res = await Axios({
        ...SummaryApi.owner.updateBus(business?.id || parseInt(id as string)),
        headers: { 
          Authorization: `Bearer ${user?.accessToken}`,
        },
        data
      });

      if (res.data.success || res.data.ok) {
        toast.success("✅ تم تحديث العمل بنجاح");
        setTimeout(() => {
          router.push("/Owner");
        }, 1500);
      } else {
        toast.error(res.data.message || "❌ فشل التحديث");
      }
      
    } catch (err: any) {
      console.error('خطأ في الحفظ:', err);
      const errorMsg = err.response?.data?.message || err.message || "حدث خطأ أثناء التحديث";
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-cairo">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 font-cairo" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* الهيدر */}
        <div className="mb-8">
          <button 
            onClick={() => router.push("/Owner")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <X className="w-5 h-5" />
            <span>العودة</span>
          </button>
          
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">تعديل العمل التجاري</h1>
            <p className="text-blue-100">قم بتحديث معلومات عملك لجذب المزيد من العملاء</p>
          </div>
        </div>

        {/* نموذج التعديل */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* بطاقة المعلومات الأساسية */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">المعلومات الأساسية</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم العمل *
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  placeholder="أدخل اسم العمل"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وصف العمل
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  placeholder="صف عملك باختصار..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 ml-1" />
                  رقم الهاتف
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  placeholder="مثال: 05XXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* بطاقة التصنيف */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">التصنيف</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                اختر تصنيف عملك
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 appearance-none bg-white"
              >
                <option value={0}>-- اختر تصنيف --</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id} className="py-2">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* بطاقة العنوان */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">العنوان</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Map className="inline w-4 h-4 ml-1" />
                  العنوان التفصيلي
                </label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  placeholder="الحي، الشارع، المبنى"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدينة
                </label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  placeholder="اسم المدينة"
                />
              </div>
            </div>
          </div>

          {/* بطاقة الموقع الإلكتروني */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <GlobeIcon className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">الموقع الإلكتروني</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الموقع (اختياري)
              </label>
              <input
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                type="url"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* بطاقة ساعات العمل - الإصلاح هنا */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">ساعات العمل</h2>
              </div>
              
              <button
                type="button"
                onClick={() => setShowHoursEditor(!showHoursEditor)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {showHoursEditor ? (
                  <span className="flex items-center gap-1">
                    <X className="w-4 h-4" /> إخفاء المحرر
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> تعديل الساعات
                  </span>
                )}
              </button>
            </div>
            
            {showHoursEditor ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    أدخل ساعات العمل (يوم في كل سطر)
                  </label>
                  <textarea
                    value={hoursText}
                    onChange={handleHoursChange}
                    rows={7}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 font-mono text-right"
                    placeholder={`الأحد: 09:00 - 17:00
الاثنين: 08:30 - 18:00
الثلاثاء: مغلق
الأربعاء: 10:00 - 19:00
الخميس: 09:00 - 20:00
الجمعة: مغلق
السبت: 10:00 - 16:00`}
                  />
                </div>
                
                {/* تلميح بالأيام المتاحة */}
                <div className="bg-amber-50 p-4 rounded-xl">
                  <p className="text-sm text-amber-800 mb-2">
                    💡 <strong>التنسيق الصحيح:</strong> يوم: وقت الفتح - وقت الإغلاق
                  </p>
                  <div className="text-xs text-amber-700">
                    <p className="font-medium mb-1">الأيام المتاحة (اكتبها كما هي):</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(dayMap).map(day => (
                        <span key={day} className="px-2 py-1 bg-amber-100 rounded">
                          {day}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2">مثال: الأحد: 09:00 - 17:00 أو الثلاثاء: مغلق</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl">
                {hoursText ? (
                  <div className="space-y-2">
                    {hoursText.split('\n').map((line, idx) => (
                      line.trim() && (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                          <span className="font-medium text-gray-700">
                            {line.split(':')[0]}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            line.toLowerCase().includes('مغلق') 
                              ? 'bg-red-100 text-red-800' 
                              : line.toLowerCase().includes('غير محدد')
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {line.split(':')[1]?.trim() || 'غير محدد'}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لم يتم تحديد ساعات العمل بعد</p>
                    <p className="text-sm text-gray-400 mt-1">انقر على "تعديل الساعات" لإضافتها</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* بطاقة الصور */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-100 rounded-lg">
                <ImageIcon className="w-6 h-6 text-pink-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">صور العمل</h2>
            </div>
            
            {/* زر رفع الصور */}
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">اسحب وأفلت الصور هنا أو انقر للاختيار</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF بحد أقصى 10 صور</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* معرض الصور */}
            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div 
                    key={index} 
                    className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <img
                      src={preview.url}
                      alt={`صورة ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />
                    
                    {/* تأثير Hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* شارة المحذوفة */}
                    {preview.type === 'existing' && images.removed.includes(preview.id!) && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        محذوفة
                      </div>
                    )}
                    
                    {/* شارة جديدة */}
                    {preview.type === 'new' && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        جديدة
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد صور لعرضها</p>
                <p className="text-sm text-gray-400 mt-1">أضف صوراً لجذب المزيد من العملاء</p>
              </div>
            )}
            
            {/* عداد الصور */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {imagePreviews.length} / 10 صورة
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {10 - imagePreviews.length} صور متاحة
                </span>
              </div>
            </div>
          </div>

          {/* أزرار الحفظ */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
            <button
              type="button"
              onClick={() => router.push("/Owner")}
              className="px-8 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              إلغاء التعديلات
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}