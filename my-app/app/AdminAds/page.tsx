"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import Axios from "../utilts/Axios";
import SummaryApi from "../common/SummaryApi";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { 
  motion, 
  AnimatePresence 
} from "framer-motion";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  RefreshCw,
  Megaphone,
  BarChart3,
  Calendar,
  Store,
  Users,
  LogOut,
  Layers,
  ArrowLeft
} from "lucide-react";

interface AdData {
  id: number;
  title: string;
  content: string;
  bannerType: string;
  targetType: "GENERAL" | "BUSINESS";
  targetId?: number;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  isActive: boolean;
  startAt: string;
  endAt: string;
  clicks: number;
  impressions: number;
  priority: number;
  imageUrl?: string;
  mobileImageUrl?: string;
  tabletImageUrl?: string;
  createdAt: string;
  business?: {
    id: number;
    name: string;
  };
  rejectionReason?: string;
}

interface StoreUser {
  id: number;
  name?: string;
  username: string;
  role: "ADMIN" | "OWNER";
  accessToken: string;
}

export default function AdminAds() {
  const router = useRouter();
const [statusParam, setStatusParam] = useState<string | null>(null);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  setStatusParam(params.get("status"));
}, []);


  const [loading, setLoading] = useState(true);
  const user = useSelector((state: RootState) => state.user.user) as StoreUser | null;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBannerType, setFilterBannerType] = useState("all");
  const [selectedAds, setSelectedAds] = useState<number[]>([]);
  const [adsData, setAdsData] = useState<AdData[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    expired: 0
  });

  // جلب جميع الإعلانات
  const fetchAds = async () => {
    try {
      setLoading(true);
      const status = statusParam || filterStatus;
      const bannerType = filterBannerType !== "all" ? filterBannerType : undefined;
      const searchQuery = search || undefined;

      const res = await Axios({
        ...SummaryApi.ad.get_all_ads,
        params: {
          page: 1,
          limit: 50,
          ...(status !== "all" && { status }),
          ...(bannerType && { bannerType }),
          ...(searchQuery && { search: searchQuery })
        }
      });
      
      if (res.data && res.data.ads) {
        setAdsData(res.data.ads);
        updateStats(res.data.ads);
      }
    } catch (err) {
      console.error("Error fetching ads:", err);
      toast.error("فشل في جلب الإعلانات");
    } finally {
      setLoading(false);
    }
  };

  // تحديث الإحصائيات
  const updateStats = (ads: AdData[]) => {
    const now = new Date();
    setStats({
      total: ads.length,
      pending: ads.filter(ad => ad.status === "PENDING_REVIEW").length,
      approved: ads.filter(ad => ad.status === "APPROVED").length,
      rejected: ads.filter(ad => ad.status === "REJECTED").length,
      active: ads.filter(ad => 
        ad.status === "APPROVED" && 
        ad.isActive && 
        new Date(ad.startAt) <= now && 
        new Date(ad.endAt) >= now
      ).length,
      expired: ads.filter(ad => new Date(ad.endAt) < now).length
    });
  };

  // تغيير حالة الإعلان
  const updateAdStatus = async (id: number, status: "APPROVED" | "REJECTED", rejectionReason?: string) => {
    try {
      const res = await Axios({
        ...SummaryApi.ad.update_ad_status(id),
        data: { status, rejectionReason }
      });
      
      if (res.data.ok) {
        toast.success(`تم ${status === "APPROVED" ? "الموافقة على" : "رفض"} الإعلان`);
        fetchAds();
      }
    } catch (err) {
      toast.error("فشل في تحديث الحالة");
    }
  };

  // حذف إعلان
  const deleteAd = async (id: number) => {
    if (!confirm("تأكيد حذف الإعلان؟")) return;
    
    try {
      const res = await Axios(SummaryApi.ad.delete_ad(id));
      if (res.data.ok) {
        toast.success("تم الحذف بنجاح");
        setAdsData(prev => prev.filter(ad => ad.id !== id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطأ بالحذف");
    }
  };

  // الحذف الجماعي
  const bulkDelete = async () => {
    if (!selectedAds.length || !confirm(`تأكيد حذف ${selectedAds.length} إعلان؟`)) return;
    
    try {
      await Promise.all(selectedAds.map(id => Axios(SummaryApi.ad.delete_ad(id))));
      toast.success(`✅ تم حذف ${selectedAds.length} إعلان`);
      setSelectedAds([]);
      fetchAds();
    } catch (err) {
      toast.error("فشل في الحذف الجماعي");
    }
  };

  // تصدير البيانات
  const exportAds = () => {
    const csvData = adsData.map(ad => ({
      "ID": ad.id,
      "العنوان": ad.title,
      "النوع": ad.bannerType,
      "الحالة": ad.status === "PENDING_REVIEW" ? "بإنتظار المراجعة" : 
                 ad.status === "APPROVED" ? "مقبول" : "مرفوض",
      "النقرات": ad.clicks,
      "المشاهدات": ad.impressions,
      "تاريخ البدء": new Date(ad.startAt).toLocaleDateString('ar-SA'),
      "تاريخ الإنتهاء": new Date(ad.endAt).toLocaleDateString('ar-SA'),
      "تاريخ الإنشاء": new Date(ad.createdAt).toLocaleDateString('ar-SA')
    }));
    
    const csvHeaders = Object.keys(csvData[0] || {}).join(',');
    const csvRows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `${csvHeaders}\n${csvRows}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchAds();
  }, [user, router, filterStatus, filterBannerType, search]);


  

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-cairo">جاري تحميل الإعلانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/AdminController")}
                className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  إدارة الإعلانات
                </h1>
                <p className="text-gray-600 mt-2 text-lg">إدارة وعرض جميع الإعلانات في النظام</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/addAds"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                إعلان جديد
              </Link>
              <button
                onClick={exportAds}
                className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-sm"
              >
                <Download className="w-5 h-5" />
                تصدير
              </button>
              <button
                onClick={fetchAds}
                className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                تحديث
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8"
        >
          {[
            { label: "إجمالي الإعلانات", value: stats.total, color: "blue", icon: Megaphone },
            { label: "بإنتظار المراجعة", value: stats.pending, color: "yellow", icon: Clock },
            { label: "مقبولة", value: stats.approved, color: "green", icon: CheckCircle },
            { label: "مرفوضة", value: stats.rejected, color: "red", icon: XCircle },
            { label: "نشطة الآن", value: stats.active, color: "emerald", icon: BarChart3 },
            { label: "منتهية", value: stats.expired, color: "gray", icon: Calendar },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  placeholder="ابحث في الإعلانات..."
                  className="w-full pl-4 pr-9 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all bg-gray-50 focus:bg-white text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <select
                className="pl-4 pr-9 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all bg-gray-50 focus:bg-white appearance-none min-w-[150px] text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">جميع الحالات</option>
                <option value="PENDING_REVIEW">بإنتظار المراجعة</option>
                <option value="APPROVED">مقبولة</option>
                <option value="REJECTED">مرفوضة</option>
              </select>

              <select
                className="pl-4 pr-9 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all bg-gray-50 focus:bg-white appearance-none min-w-[150px] text-sm"
                value={filterBannerType}
                onChange={(e) => setFilterBannerType(e.target.value)}
              >
                <option value="all">جميع الأنواع</option>
                <option value="MAIN_HERO">بانر رئيسي</option>
                <option value="SIDE_BAR">شريط جانبي</option>
                <option value="POPUP">نافذة منبثقة</option>
              </select>
            </div>

            {selectedAds.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={bulkDelete}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف ({selectedAds.length})</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Ads Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-right">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAds(adsData.map(ad => ad.id));
                        } else {
                          setSelectedAds([]);
                        }
                      }}
                      checked={selectedAds.length === adsData.length && adsData.length > 0}
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                    />
                  </th>
                  <th className="p-3 text-right text-gray-700 font-semibold">الإعلان</th>
                  <th className="p-3 text-right text-gray-700 font-semibold">الحالة</th>
                  <th className="p-3 text-right text-gray-700 font-semibold">التحليلات</th>
                  <th className="p-3 text-right text-gray-700 font-semibold">الجدول الزمني</th>
                  <th className="p-3 text-right text-gray-700 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {adsData.map((ad, index) => {
                    const now = new Date();
                    const startDate = new Date(ad.startAt);
                    const endDate = new Date(ad.endAt);
                    const isActive = ad.status === "APPROVED" && ad.isActive && startDate <= now && endDate >= now;
                    const isExpired = endDate < now;
                    
                    return (
                      <motion.tr
                        key={ad.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedAds.includes(ad.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAds(prev => [...prev, ad.id]);
                              } else {
                                setSelectedAds(prev => prev.filter(id => id !== ad.id));
                              }
                            }}
                            className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-start gap-3">
                            {ad.imageUrl && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <img 
                                  src={ad.imageUrl} 
                                  alt={ad.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 mb-1">{ad.title}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  {ad.bannerType === "MAIN_HERO" ? "بانر رئيسي" : 
                                   ad.bannerType === "SIDE_BAR" ? "شريط جانبي" : "منبثقة"}
                                </span>
                                {ad.business && (
                                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                                    <Store className="w-3 h-3" />
                                    {ad.business.name}
                                  </span>
                                )}
                                {ad.targetType === "GENERAL" && (
                                  <span className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs">
                                    عام
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              ad.status === "APPROVED" ? "bg-green-100 text-green-800" :
                              ad.status === "REJECTED" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {ad.status === "APPROVED" ? (
                                <>
                                  <CheckCircle className="w-3 h-3 ml-1" />
                                  مقبول
                                </>
                              ) : ad.status === "REJECTED" ? (
                                <>
                                  <XCircle className="w-3 h-3 ml-1" />
                                  مرفوض
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 ml-1" />
                                  بانتظار المراجعة
                                </>
                              )}
                            </div>
                            {isActive && (
                              <div className="inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">
                                <BarChart3 className="w-3 h-3 ml-1" />
                                نشط
                              </div>
                            )}
                            {isExpired && (
                              <div className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                <Calendar className="w-3 h-3 ml-1" />
                                منتهي
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-gray-600 text-xs">النقرات</span>
                              <span className="font-medium">{ad.clicks}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-gray-600 text-xs">المشاهدات</span>
                              <span className="font-medium">{ad.impressions}</span>
                            </div>
                            {ad.clicks > 0 && (
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-gray-600 text-xs">نسبة النقر</span>
                                <span className="font-medium text-emerald-600">
                                  {((ad.clicks / ad.impressions) * 100).toFixed(2)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600">
                              <Calendar className="w-3 h-3 inline ml-1" />
                              البدء: {new Date(ad.startAt).toLocaleDateString('ar-SA')}
                            </div>
                            <div className="text-xs text-gray-600">
                              <Calendar className="w-3 h-3 inline ml-1" />
                              الإنتهاء: {new Date(ad.endAt).toLocaleDateString('ar-SA')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {isActive && (
                                <span className="text-emerald-600">
                                  متبقي: {Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24))} يوم
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                              <button
                                onClick={() => router.push(`/AdminAds/edit/${ad.id}`)}
                                className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex-1 flex justify-center"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteAd(ad.id)}
                                className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex-1 flex justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            {ad.status === "PENDING_REVIEW" && user?.role === "ADMIN" && (
                              <div className="flex gap-1 mt-1">
                                <button
                                  onClick={() => updateAdStatus(ad.id, "APPROVED")}
                                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs flex-1"
                                >
                                  قبول
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt("سبب الرفض (اختياري):");
                                    if (reason !== null) {
                                      updateAdStatus(ad.id, "REJECTED", reason);
                                    }
                                  }}
                                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs flex-1"
                                >
                                  رفض
                                </button>
                              </div>
                            )}
                            
                            <button
                              onClick={() => router.push(`/AdminAds/view/${ad.id}`)}
                              className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors text-xs mt-1"
                            >
                              <Eye className="w-3 h-3 inline ml-1" />
                              معاينة
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {adsData.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد إعلانات</h3>
              <p className="text-gray-600 mb-6">ابدأ بإضافة إعلان جديد للنظام</p>
              <Link
                href="/addAds"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                إعلان جديد
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}