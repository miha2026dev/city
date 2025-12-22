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
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  RefreshCw,
  Download,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Store,
  Tag,
  Users,
  MousePointerClick,
  Eye as EyeIcon,
  Loader2,
  Shield,
  FileEdit
} from "lucide-react";

interface StoreUser {
  id: number;
  name?: string;
  username: string;
  role: "ADMIN" | "OWNER";
  accessToken: string;
}

interface Ad {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  mobileImageUrl?: string;
  tabletImageUrl?: string;
  bannerType: "MAIN_HERO" | "SIDE_BAR" | "POPUP";
  targetType: string;
  targetId: number | null;
  startAt: string;
  endAt: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  isActive: boolean;
  priority: number;
  clicks: number;
  impressions: number;
  ctaText?: string;
  ctaUrl?: string;
  url?: string;
  backgroundColor?: string;
  textColor?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  business?: {
    id: number;
    name: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

export default function OwnerAdsPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.user) as StoreUser | null;
  
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 1
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    totalClicks: 0,
    totalImpressions: 0
  });
  
  // فلاتر البحث
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    bannerType: ""
  });
  
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [limit] = useState(10);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [token, setToken] = useState<string | null>(null);

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

  const fetchAds = async (page=1) => {
  
     
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.bannerType && { bannerType: filters.bannerType }),
        ...(filters.search && { search: filters.search }),
        sortBy,
        sortOrder
      });

      const res = await Axios({
        ...SummaryApi.ad.get_my_ads,
        url: `${SummaryApi.ad.get_my_ads.url}?${queryParams.toString()}`, 
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
     console.log(res.data)
     if (res.data && res.data.ads) {
       setAds(res.data.ads || []);
       setPagination(
         res.data.pagination || {
           total: 0,
           page: 1,
           pages: 1,
         }
       );
     }

    } catch (error: any) {
      console.error("Error fetching ads:", error);
      toast.error(error.response?.data?.message || "فشل في تحميل الإعلانات");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    
    try {
      const res = await Axios({
        ...SummaryApi.ad.get_my_ads,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    if (res.data && Array.isArray(res.data.ads)) {
      const adsList = res.data.ads;

      const statsData = {
        total: adsList.length,
        pending: adsList.filter((ad: Ad) => ad.status === "PENDING_REVIEW")
          .length,
        approved: adsList.filter((ad: Ad) => ad.status === "APPROVED").length,
        rejected: adsList.filter((ad: Ad) => ad.status === "REJECTED").length,
        active: adsList.filter(
          (ad: Ad) => ad.isActive && ad.status === "APPROVED"
        ).length,
        totalClicks: adsList.reduce(
          (sum: number, ad: Ad) => sum + (ad.clicks || 0),
          0
        ),
        totalImpressions: adsList.reduce(
          (sum: number, ad: Ad) => sum + (ad.impressions || 0),
          0
        ),
      };

      setStats(statsData);
    }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
   
      fetchAds();
      fetchStats();
    
  }, [token, user, filters, sortBy, sortOrder]);


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

  if (!user || user.role !== "OWNER") {
    return null;
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      fetchAds(page);
    }
  };

  const viewAdDetails = (ad: Ad) => {
    setSelectedAd(ad);
    setShowDetails(true);
  };

  const editAd = (ad: Ad) => {
    router.push(`/owner/ads/edit/${ad.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            معتمد
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
            <Clock className="w-4 h-4" />
            قيد المراجعة
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            مرفوض
          </span>
        );
      default:
        return null;
    }
  };

  const getBannerTypeLabel = (type: string) => {
    switch (type) {
      case "MAIN_HERO":
        return "بانر رئيسي";
      case "SIDE_BAR":
        return "شريط جانبي";
      case "POPUP":
        return "نافذة منبثقة";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return "0%";
    return ((clicks / impressions) * 100).toFixed(2) + "%";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto">
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
                  إدارة الإعلانات
                </h1>
                <p className="text-gray-600 mt-1">إعلانات متجرك ومستويات أدائها</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/OwnerAdsAdd")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إنشاء إعلان جديد
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي الإعلانات</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Tag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {stats.approved} معتمد
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  {stats.pending} قيد المراجعة
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي النقرات</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClicks}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <MousePointerClick className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {stats.totalImpressions} ظهور •{" "}
                {calculateCTR(stats.totalClicks, stats.totalImpressions)} CTR
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">الإعلانات النشطة</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                قيد التشغيل حالياً
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">المرفوضة</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.rejected}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                بحاجة إلى تعديل
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث في الإعلانات..."
                  value={filters.search}
                  onChange={handleSearch}
                  className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">جميع الحالات</option>
                <option value="PENDING_REVIEW">قيد المراجعة</option>
                <option value="APPROVED">معتمد</option>
                <option value="REJECTED">مرفوض</option>
              </select>

              <select
                value={filters.bannerType}
                onChange={(e) => handleFilterChange("bannerType", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">جميع الأنواع</option>
                <option value="MAIN_HERO">بانر رئيسي</option>
                <option value="SIDE_BAR">شريط جانبي</option>
                <option value="POPUP">نافذة منبثقة</option>
              </select>

              <button
                onClick={() => {
                  setFilters({ status: "", search: "", bannerType: "" });
                  setSortBy("createdAt");
                  setSortOrder("desc");
                }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تعيين
              </button>
            </div>
          </div>
        </motion.div>

        {/* Ads Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل الإعلانات...</p>
            </div>
          ) : ads.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <Tag className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد إعلانات</h3>
              <p className="text-gray-600 mb-6">ابدأ بإنشاء أول إعلان لمتجرك</p>
              <button
                onClick={() => router.push("/create-ad")}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                إنشاء أول إعلان
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-right text-sm font-semibold text-gray-900">
                        الإعلان
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-semibold text-gray-900">
                        <button
                          onClick={() => handleSort("status")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          الحالة
                          <Filter className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-semibold text-gray-900">
                        <button
                          onClick={() => handleSort("clicks")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          النقرات
                          <Filter className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-semibold text-gray-900">
                        <button
                          onClick={() => handleSort("startAt")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          الفترة
                          <Filter className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-semibold text-gray-900">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ads.map((ad) => (
                      <motion.tr
                        key={ad.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.5)" }}
                        className="transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={ad.imageUrl || "/placeholder-image.jpg"}
                                alt={ad.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">{ad.title}</h4>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {ad.content}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {getBannerTypeLabel(ad.bannerType)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(ad.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-2">
                            {getStatusBadge(ad.status)}
                            {ad.isActive ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded self-start">
                                نشط
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded self-start">
                                غير نشط
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <MousePointerClick className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">{ad.clicks}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <EyeIcon className="w-4 h-4 text-green-500" />
                              <span className="font-medium">{ad.impressions}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              CTR: {calculateCTR(ad.clicks, ad.impressions)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <Calendar className="w-4 h-4 inline ml-1 text-gray-400" />
                              <span className="text-gray-600"> من </span>
                              <span className="font-medium">
                                {formatDate(ad.startAt)}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600"> إلى </span>
                              <span className="font-medium">
                                {formatDate(ad.endAt)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewAdDetails(ad)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {(ad.status === "REJECTED" || ad.status === "PENDING_REVIEW") && (
                              <button
                                onClick={() => editAd(ad)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="تعديل"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      عرض <span className="font-medium">{ads.length}</span> من{" "}
                      <span className="font-medium">{pagination.total}</span> إعلان
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 rounded-lg ${
                              pagination.page === pageNum
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Ad Details Modal */}
        {showDetails && selectedAd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">تفاصيل الإعلان</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* الصورة الرئيسية */}
                  <div className="lg:col-span-2">
                    <div className="rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={selectedAd.imageUrl || "/placeholder-image.jpg"}
                        alt={selectedAd.title}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {selectedAd.mobileImageUrl && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">صورة الجوال:</p>
                          <img
                            src={selectedAd.mobileImageUrl}
                            alt="Mobile"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      {selectedAd.tabletImageUrl && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">صورة التابلت:</p>
                          <img
                            src={selectedAd.tabletImageUrl}
                            alt="Tablet"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* المعلومات الأساسية */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">المعلومات الأساسية</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">العنوان:</p>
                          <p className="font-medium">{selectedAd.title}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">الحالة:</p>
                          <div className="mt-1">{getStatusBadge(selectedAd.status)}</div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">نوع البانر:</p>
                          <p className="font-medium">
                            {getBannerTypeLabel(selectedAd.bannerType)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">تاريخ الإنشاء:</p>
                          <p className="font-medium">{formatDate(selectedAd.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* الإحصائيات */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">الإحصائيات</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-600">النقرات</p>
                          <p className="text-2xl font-bold">{selectedAd.clicks}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-green-600">الظهور</p>
                          <p className="text-2xl font-bold">{selectedAd.impressions}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg col-span-2">
                          <p className="text-sm text-purple-600">معدل النقر (CTR)</p>
                          <p className="text-2xl font-bold">
                            {calculateCTR(selectedAd.clicks, selectedAd.impressions)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* المحتوى والتفاصيل */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">المحتوى</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {selectedAd.content}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">الفترة الزمنية</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">بداية العرض:</span>
                        <span className="font-medium">{formatDate(selectedAd.startAt)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">نهاية العرض:</span>
                        <span className="font-medium">{formatDate(selectedAd.endAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* الروابط */}
                {(selectedAd.ctaText || selectedAd.ctaUrl || selectedAd.url) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">الروابط</h3>
                    <div className="space-y-3">
                      {selectedAd.ctaText && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">زر الإجراء:</span>
                          <span className="font-medium">{selectedAd.ctaText}</span>
                        </div>
                      )}
                      {selectedAd.ctaUrl && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 mb-1">رابط زر الإجراء:</p>
                          <a
                            href={selectedAd.ctaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {selectedAd.ctaUrl}
                          </a>
                        </div>
                      )}
                      {selectedAd.url && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 mb-1">رابط الإعلان:</p>
                          <a
                            href={selectedAd.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {selectedAd.url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* سبب الرفض */}
                {selectedAd.status === "REJECTED" && selectedAd.rejectionReason && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">
                      <AlertCircle className="w-5 h-5 inline ml-1" />
                      سبب الرفض:
                    </h4>
                    <p className="text-red-700">{selectedAd.rejectionReason}</p>
                  </div>
                )}
                
                {/* الإجراءات */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    إغلاق
                  </button>
                  {(selectedAd.status === "REJECTED" || selectedAd.status === "PENDING_REVIEW") && (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        editAd(selectedAd);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                    >
                      تعديل الإعلان
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}