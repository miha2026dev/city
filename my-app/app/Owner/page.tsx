"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useRouter } from "next/navigation";
import Axios from "../utilts/Axios";
import SummaryApi from "../common/SummaryApi";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Building,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Users,
  Star,
  Phone,
  MapPin,
  BarChart3,
  MessageCircle,
  Bell,
  Settings,
  RefreshCw,
  TrendingUp,
  Heart,
  Search,
  Filter,
  LogOut,
  AlertCircle,
  Calendar1,
  Megaphone
} from "lucide-react";
import Link from "next/link";
import { clearSession } from "../store/userSlice";

interface Business {
  id: number;
  name: string;
  slug: string;
  description?: string; 
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
  featured: boolean;
  isVerified: boolean;
  phone?: string;
  address?: string;
  city?: string;
  createdAt: string;
  stats?: {
    views: number;
    clicks: number;
    calls: number;
    favorites: number;
    reviews: number;
  };
  _count?: {
    reviews: number;
    favorites: number;
    follows: number;
  };
}

interface StoreUser {
  id: number;
  username: string;
  name?: string;
  role: "OWNER";
  accessToken: string;
}

export default function OwnerDashboard() {
  const user = useSelector((state: RootState) => state.user.user) as StoreUser | null;
  const router = useRouter();
  const dispatch = useDispatch();
  
  // ⬇️ تغيير هنا: business واحد بدلاً من array
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    pendingBusinesses: 0,
    totalViews: 0,
    totalFavorites: 0,
    totalReviews: 0
  });

  // ⬇️ تعديل دالة fetchOwnerData
  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      
      if (!user || !user.accessToken) {
        toast.error("يرجى تسجيل الدخول أولاً");
  
        return;
      }

      // 1. جلب العمل الوحيد للمستخدم
      const response = await Axios({
        ...SummaryApi.owner.get_bus,
        headers: { 
          Authorization: `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.ok) {
        setBusiness(response.data.data);
        
        // 2. إذا كان هناك عمل، اجلب إحصائياته
        if (response.data.data) {
          const statsRes = await Axios({
            ...SummaryApi.owner.getbusinessesState,
            headers:{
               Authorization: `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          if (statsRes.data.ok) {
            setStats({
              totalBusinesses: 1, // دائماً 1 لأن لكل مستخدم عمل واحد فقط
              activeBusinesses: response.data.data.status === "APPROVED" ? 1 : 0,
              pendingBusinesses: response.data.data.status === "PENDING" ? 1 : 0,
              totalViews: statsRes.data.data.stats?.[0]?.views || 0,
              totalFavorites: statsRes.data.data.favoritesCount || 0,
              totalReviews: statsRes.data.data.totalReviews || 0
            });
          }
        }
      } else {
        // إذا لم يكن هناك عمل
        setBusiness(null);
        setStats({
          totalBusinesses: 0,
          activeBusinesses: 0,
          pendingBusinesses: 0,
          totalViews: 0,
          totalFavorites: 0,
          totalReviews: 0
        });
      }
      
    } catch (err: any) {
      console.error('Error:', err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        toast.error("انتهت صلاحية الجلسة");
        dispatch(clearSession());
        router.push('/Login');
      } else {
        toast.error("حدث خطأ في تحميل البيانات");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, [user]);

  // ⬇️ تعديل دالة الحذف
  const deleteBusiness = async () => {
    if (!business) return;
    
    if (!confirm("هل أنت متأكد من حذف هذا العمل؟")) return;

    try {
      await Axios({
        ...SummaryApi.owner.deleteBus(business.id),
        headers: { Authorization: `Bearer ${user!.accessToken}` }
      });

      toast.success("✅ تم حذف العمل بنجاح");
      setBusiness(null);
      setStats({
        totalBusinesses: 0,
        activeBusinesses: 0,
        pendingBusinesses: 0,
        totalViews: 0,
        totalFavorites: 0,
        totalReviews: 0
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "فشل في حذف العمل");
    }
  };

  // ⬇️ تعديل quickStats لتتناسب مع عمل واحد
  const quickStats = [
    {
      label: "حالة العمل",
      value: business ? (business.status === "APPROVED" ? "مفعل" : "قيد المراجعة") : "غير مسجل",
      icon: Building,
      color: business?.status === "APPROVED" ? "green" : "yellow",
      change: ""
    },
    {
      label: "المشاهدات",
      value: stats.totalViews,
      icon: TrendingUp,
      color: "purple",
      change: "+12%"
    },
    {
      label: "المفضلة",
      value: stats.totalFavorites,
      icon: Heart,
      color: "red",
      change: "+5"
    },
    {
      label: "التقييمات",
      value: stats.totalReviews,
      icon: Star,
      color: "amber",
      change: "+3"
    },
    {
      label: "المتابعين",
      value: business?._count?.follows || 0,
      icon: Users,
      color: "blue",
      change: "+2"
    },
    {
      label: "تاريخ الإضافة",
      value: business ? new Date(business.createdAt).toLocaleDateString('ar-SA') : "-",
      icon: Calendar1,
      color: "gray",
      change: ""
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "SUSPENDED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED": return "مفعل";
      case "PENDING": return "قيد المراجعة";
      case "REJECTED": return "مرفوض";
      case "SUSPENDED": return "موقوف";
      default: return status;
    }
  };

  const handleLogout = () => {
    try {
      dispatch(clearSession());
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      sessionStorage.clear();
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
  {/**==================== work show window=========== */}

  const [previewModal, setPreviewModal] = useState<{
  isOpen: boolean;
  business: Business | null;
}>({
  isOpen: false,
  business: null
});

// دالة فتح الـ Modal
const openPreviewModal = (business: Business) => {
  setPreviewModal({
    isOpen: true,
    business
  });
};

// دالة إغلاق الـ Modal
const closePreviewModal = () => {
  setPreviewModal({
    isOpen: false,
    business: null
  });
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-cairo">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // ⬇️ إضافة import للـ Calendar إذا لم يكن موجود
  const Calendar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-cairo p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent">
                {business ? `مرحباً بك في ${business.name}` : "لوحة تحكم صاحب العمل"}
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                {business 
                  ? "إدارة عملك وتتبع أدائه" 
                  : "سجل عملك الآن للظهور في دليل الأعمال"
                } {user?.name && `، ${user.name}`}
              </p>
            </div>

            <div className="flex items-center justify-center flex-row gap-3">
              {/* زر إضافة عمل - يظهر فقط إذا لم يكن هناك عمل */}
              {!business && (
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/addBusiness"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    سجل عملك الآن
                  </Link>
                </motion.div>
              )}

              {/* زر تحديث */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchOwnerData}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 border border-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث
              </motion.button>

              {/* زر خروج */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 border border-gray-200"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* حالة عدم وجود عمل */}
        {!business ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
          >
            <div className="w-32 h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              ليس لديك عمل مسجل
            </h3>
            <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
              سجل عملك الآن للظهور في دليل الأعمال والاستفادة من مميزات المنصة
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/addBusiness"
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-lg font-medium inline-flex items-center gap-2"
                >
                  <Plus className="w-6 h-6" />
                  سجل عملك الآن
                </Link>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchOwnerData}
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 text-lg font-medium"
              >
                <RefreshCw className="w-5 h-5 inline ml-2" />
                تحديث الصفحة
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Quick Stats - عندما يكون هناك عمل */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8"
            >
              {quickStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      {stat.change && (
                        <p className={`text-xs mt-1 ${
                          stat.change.startsWith('+') ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {stat.change} من الشهر الماضي
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Business Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {business.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{business.name}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(business.status)}`}>
                          {getStatusText(business.status)}
                        </span>
                        {business.featured && (
                          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                            متميز
                          </span>
                        )}
                        {business.isVerified && (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            موثق
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                  
                      <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push(`/OwnerAds`)}
                          className="px-4 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-300 flex items-center gap-2"
                        >
                          <Megaphone className="w-4 h-4" />
                            إدارة الإعلانات
                        </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push(`/EditBus/${business.id}`)}
                      className="px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-300 flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      تعديل
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* تفاصيل العمل */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-500" />
                      تفاصيل العمل
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">العنوان</p>
                          <p className="text-gray-900">{business.address || "غير محدد"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">رقم الهاتف</p>
                          <p className="text-gray-900">{business.phone || "غير محدد"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">المدينة</p>
                          <p className="text-gray-900">{business.city || "غير محدد"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">الوصف</p>
                        <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                          {business.description || "لا يوجد وصف"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* الإحصائيات */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                      إحصائيات العمل
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Eye className="w-6 h-6 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-600">المشاهدات</p>
                            <p className="text-2xl font-bold text-gray-900">{business.stats?.views || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Heart className="w-6 h-6 text-red-500" />
                          <div>
                            <p className="text-sm text-gray-600">المفضلة</p>
                            <p className="text-2xl font-bold text-gray-900">{business._count?.favorites || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Star className="w-6 h-6 text-amber-500" />
                          <div>
                            <p className="text-sm text-gray-600">التقييمات</p>
                            <p className="text-2xl font-bold text-gray-900">{business._count?.reviews || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Users className="w-6 h-6 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-600">المتابعين</p>
                            <p className="text-2xl font-bold text-gray-900">{business._count?.follows || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* إجراءات إضافية */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex flex-wrap gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push(`/business/${business.slug}/reviews`)}
                          className="px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors duration-300 flex items-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          التقييمات
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push(`/business/${business.slug}/analytics`)}
                          className="px-4 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-300 flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          تحليلات مفصلة
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={deleteBusiness}
                          className="px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-300 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف العمل
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
          </>
        )}
      </div>
    </div>
  );
}