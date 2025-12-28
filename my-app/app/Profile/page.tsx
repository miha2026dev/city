"use client";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import Axios from "../utilts/Axios";
import { useSelector } from "react-redux";
import { RootState ,} from "../store/store";
import SummaryApi from "../common/SummaryApi";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Phone, 
  Shield, 
  Heart, 
  Bookmark, 
  Bell, 
  Calendar,
  Edit3,
  Settings,
  LogOut,
  Star,
  MapPin
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EditProfilePage from "../UserProfileEdit/page";
import Link from "next/link";
import { clearSession } from "../store/userSlice";
import toast from "react-hot-toast";
type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Review {
  id: number;
  businessId: number;
  userId: number;
  rating: number;
  title?: string;
  comment?: string;
  status: ReviewStatus;
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  business?: {
    id: number;
    name: string;
    slug: string;
  };
}

interface UserData {
  id: number;
  username: string;
  name?: string;
  phone?: string;
  role: "USER";
  isActive: boolean;
  avatarUrl?: string;
  lastLogin?: string;
  bio?: string;
  createdAt: string;
  reviews?: Review[];
  favorites?: { business: { id: number; name: string; slug: string } }[];
  bookmarks?: { business: { id: number; name: string; slug: string } }[];
  notifications?: { id: number; title: string; message: string; isRead: boolean; sentAt: string }[];
}

interface StoreUser {
  id: number;
  name?: string;
  username: string;
  role: "USER";
  accessToken: string;
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: RootState) => state.user.user) as StoreUser | null;
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
         if (!user || !user.accessToken) {
        toast.error("يرجى تسجيل الدخول أولاً");
         setLoading(false);
         return
         }
        const response = await Axios({
          ...SummaryApi.user.getUserById(user.id),
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });

        setUserData(response.data.data);
      
    }catch (err: any) {
        console.error("Error fetching user data:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }}

    fetchUserData();
  }, [user, router]);

const handleLogout = () => {
  try {
    dispatch(clearSession());
    // 1. إعادة تعيين بيانات المستخدم
    setUserData(null);
    
    // 2. تنظيف جميع الـ tokens من localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken"); // ← هذا مهم جداً
    localStorage.removeItem("userData");
    
    // 3. تنظيف sessionStorage
    sessionStorage.clear();
    
    console.log("Logout successful");
    router.push("/");
    
  } catch (err) {
    console.error("Logout error:", err);
  }
};

  const stats = [
    {
      label: "المفضلات",
      value: userData?.favorites?.length || 0,
      icon: Heart,
      color: "red",
      description: "الأعمال المفضلة لديك"
    },
    {
      label: "العلامات المرجعية",
      value: userData?.bookmarks?.length || 0,
      icon: Bookmark,
      color: "blue",
      description: "الأعمال المحفوظة"
    },
    {
      label: "الإشعارات",
      value: userData?.notifications?.length || 0,
      icon: Bell,
      color: "green",
      description: "الإشعارات غير المقروءة"
    },
    {
      label: "التقييمات",
      value: userData?.reviews?.length || 0, // إذا كان لديك حقل التقييمات
      icon: Star,
      color: "yellow",
      description: "التقييمات المقدمة"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-cairo">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">لم يتم العثور على البيانات</h3>
          <p className="text-gray-600 mb-6">يرجى تسجيل الدخول مرة أخرى</p>
          <button
            onClick={() => router.push("/Login")}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-cairo"
        dir="rtl"
      >
        <div className="max-w-4xl mx-auto p-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
                  الملف الشخصي
                </h1>
                <p className="text-gray-600 mt-2">مرحباً بك في صفحتك الشخصية</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
                {/* User Avatar and Info */}
                <div className="text-center mb-6">
                  {userData.avatarUrl ? (
                    <Image
                      src={userData.avatarUrl}
                      alt="avatar"
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                      {userData.name?.charAt(0) || userData.username?.charAt(0)}
                    </div>
                  )}
                  <h2 className="text-lg font-bold text-gray-900">
                    {userData.name || userData.username}
                  </h2>
                  <p className="text-gray-500 text-sm">@{userData.username}</p>
                  {userData.bio && (
                    <p className="text-gray-600 mt-2 text-sm">{userData.bio}</p>
                  )}
                </div>

                {/* Account Info */}
                <div className="space-y-3 text-sm text-gray-600 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{userData.phone || "لم يتم إضافة رقم هاتف"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>{userData.isActive ? "نشط" : "غير نشط"}</span>
                  </div>
                  {userData.lastLogin && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        آخر تسجيل دخول{" "}
                        {new Date(userData.lastLogin).toLocaleDateString(
                          "ar-SA"
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      منضم منذ{" "}
                      {new Date(userData.createdAt).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                </div>

                {/* User Stats */}
                <div className="space-y-3 mb-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                          <stat.icon
                            className={`w-4 h-4 text-${stat.color}-600`}
                          />
                        </div>
                        <div>
                          <span className="text-sm text-gray-700 block">
                            {stat.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {stat.description}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">
                        {stat.value}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Account Info */}
                <div className="space-y-3 text-sm text-gray-600 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{userData.phone || "لم يتم إضافة رقم هاتف"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>مستخدم عادي</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      منضم منذ{" "}
                      {new Date(userData.createdAt).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  {/* زر تعديل الملف الشخصي */}
                  <Link
                    href="/UserProfileEdit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    تعديل الملف الشخصي
                  </Link>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              {/* Favorites Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    الأعمال المفضلة
                  </h3>
                  <span className="text-sm text-gray-500">
                    {userData.favorites?.length || 0} عمل
                  </span>
                </div>

                {userData.favorites?.length ? (
                  <div className="space-y-3">
                    {userData.favorites.slice(0, 5).map((favorite, index) => (
                      <motion.div
                        key={favorite.business.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {favorite.business.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {favorite.business.name}
                            </p>
                            <p className="text-sm text-gray-500">عمل مفضل</p>
                          </div>
                        </div>
                        <button className="text-red-500 hover:text-red-600 transition-colors">
                          <Heart className="w-5 h-5 fill-current" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد أعمال مفضلة</p>
                    <p className="text-sm text-gray-400 mt-1">
                      يمكنك إضافة أعمال إلى المفضلة من خلال تصفح الأعمال
                    </p>
                  </div>
                )}
              </div>

              {/* Bookmarks Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-blue-500" />
                    العلامات المرجعية
                  </h3>
                  <span className="text-sm text-gray-500">
                    {userData.bookmarks?.length || 0} محفوظ
                  </span>
                </div>

                {userData.bookmarks?.length ? (
                  <div className="space-y-3">
                    {userData.bookmarks.slice(0, 5).map((bookmark, index) => (
                      <motion.div
                        key={bookmark.business.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {bookmark.business.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {bookmark.business.name}
                            </p>
                            <p className="text-sm text-gray-500">محفوظ</p>
                          </div>
                        </div>
                        <button className="text-blue-500 hover:text-blue-600 transition-colors">
                          <Bookmark className="w-5 h-5 fill-current" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد علامات مرجعية</p>
                    <p className="text-sm text-gray-400 mt-1">
                      احفظ الأعمال المهمة لك للرجوع إليها لاحقاً
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Notifications */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-green-500" />
                    آخر الإشعارات
                  </h3>
                  <span className="text-sm text-gray-500">
                    {userData.notifications?.length || 0} إشعار
                  </span>
                </div>

                {userData.notifications?.length ? (
                  <div className="space-y-3">
                    {userData.notifications
                      .slice(0, 3)
                      .map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-xl border ${
                            notification.isRead
                              ? "bg-gray-50 border-gray-200"
                              : "bg-blue-50 border-blue-200"
                          }`}
                        >
                          <p className="font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.sentAt).toLocaleDateString(
                              "ar-SA"
                            )}
                          </p>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد إشعارات</p>
                    <p className="text-sm text-gray-400 mt-1">
                      سيظهر هنا آخر الإشعارات والنشاطات
                    </p>
                  </div>
                )}
              </div>
              {userData.reviews && userData.reviews.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border p-6 mt-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" /> تقييماتك
                  </h3>
                  <div className="space-y-3">
                    {userData.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-3 rounded-xl bg-gray-50 border border-gray-200"
                      >
                        <p className="font-medium text-gray-900">
                          {review.business?.name || "-"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {review.comment}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          التقييم: {review.rating} ⭐
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}