"use client";

import { useEffect, useState } from "react";
import Axios from "../utilts/Axios";
import { toast } from "react-hot-toast";
import Link from "next/link";
import SummaryApi from "../common/SummaryApi";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Shield,
  Eye,

  Download,
  RefreshCw,
  LogOut,
  Layers,
  Megaphone,
  Clock,
  CheckCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import { clearSession } from "../store/userSlice";
  interface UsersData {
  id: number;
  username: string;
  name?: string;
  phone?: string;
  role: "ADMIN";
  avatarUrl?: string;
  createdAt: string;
  isActive:boolean;
  lastLogin:Date;
  // تم إزالة ownedBusinesses لأن المستخدم العادي لا يملك أعمالاً
}
interface StoreUser {
  id: number;
  name?: string;
  username: string;
  role: "ADMIN";
  accessToken: string;
}

export default function Admin() {
 const router = useRouter();
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: RootState) => state.user.user) as StoreUser | null;
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [usersData, setUsersData] = useState<UsersData[]>([]); // ⬅️ غيرت إلى مصفوفة
 const [activeUsers, setActiveUsers] = useState<any[]>([]);
 const dispatch=useDispatch()
 const handleLogout = () => {
   try {
     dispatch(clearSession());
     
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
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await Axios({
        ...SummaryApi.user.get_all_users
      });
      
      // تأكد من معالجة البيانات بشكل صحيح
      if (res.data && res.data.ok) {
        setUsersData(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setUsersData(res.data);
      } else {
        console.error("بيانات غير متوقعة:", res.data);
        toast.error("بيانات غير متوقعة من الخادم");
      }
    } catch (err) {
      console.error("Error details:", err);
      toast.error("فشل في جلب المستخدمين");
    } finally {
      setLoading(false);
    }
  };

const fetchActiveUsers = async () => {
  try {
    const res = await Axios({ ...SummaryApi.user.get_active });
    if (res.data.ok) {
      // استخراج جميع الـ userId بدون تكرار
      const activeUserIds = [...new Set(res.data.data.map((s: any) => s.user.id))];
      setActiveUsers(activeUserIds);
    }
  } catch (err) {
    console.error(err);
  }
};


 const deleteUser = async (id: number) => {
  if (!confirm("تأكيد حذف المستخدم؟")) return;

  try {
    const res = await Axios(SummaryApi.user.deleteUser(id));
    if (res.data.ok) {
      toast.success("تم الحذف بنجاح");
      setUsersData(prev => prev.filter(u => u.id !== id)); // ❌ هذا لا يكفي أحيانًا مع AnimatePresence
      setUsersData(prev => [...prev.filter(u => u.id !== id)]); // ✅ إعادة إنشاء array جديدة
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || "خطأ بالحذف");
  }
};


  const bulkDelete = async () => {
    if (!selectedUsers.length || !confirm(`تأكيد حذف ${selectedUsers.length} مستخدم؟`)) return;
    
    try {
      await Promise.all(selectedUsers.map(id => Axios(SummaryApi.user.deleteUser(id))));
      toast.success(`✅ تم حذف ${selectedUsers.length} مستخدم`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      toast.error("فشل في الحذف الجماعي");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchActiveUsers()
  }, [user, router]);

  const handleClick = (id: number) => {
    router.push(`/EditUser/${id}`);
  }


  const filteredUsers = usersData.filter(user => {
    const term = search.toLowerCase();
    const matchesSearch =
      user.name?.toLowerCase().includes(term) ||
      user.username?.toLowerCase().includes(term) ||
      user.phone?.toLowerCase().includes(term);

    const matchesRole = filterRole === "all" || user.role === filterRole.toUpperCase();

    return matchesSearch && matchesRole;
  });

  // الإحصائيات 
 const stats = {
  total: usersData.length,
  admins: usersData.filter(u => u.role === 'ADMIN').length,
  owners: usersData.filter(u => u.role === 'OWNER').length,
  users: usersData.filter(u => u.role === 'USER').length,
  active: activeUsers.length,
  ads: 0, 
  pendingAds: 0, // إعلانات بانتظار المراجعة
  activeAds: 0, // إعلانات نشطة
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-cairo">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 font-cairo"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-900 to-emerald-700 bg-clip-text text-transparent">
                لوحة التحكم الإدارية
              </h1>
              <p className="text-blue-600 mt-2 text-lg mr-2">
                إدارة المستخدمين والصلاحيات في النظام
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center flex-row gap-3">
                  {/* زر أنيق مع تأثير خفيف */}
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/AddUser"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      إضافة مستخدم جديد
                    </Link>
                  </motion.div>

                  {/* 🔥 زر إدارة التصنيفات */}
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/AdminCategories"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Layers className="w-5 h-5" />
                      إدارة التصنيفات
                    </Link>
                  </motion.div>

                  {/** زر اداره الاعلانات */}
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href="/AdminAds"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Megaphone className="w-5 h-5" />
                      إدارة الإعلانات
                    </Link>
                  </motion.button>

                  {/* زر خروج بسيط وأنيق */}
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

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/")}
                  className=" text-gray-700 hover:text-gray-600 transition-colors duration-300 mt-2"
                >
                  العودة للصفحة الرئيسية
                </motion.button>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          {[
            {
              label: "إجمالي المستخدمين",
              value: stats.total,
              icon: Users,
              color: "blue",
            },
            {
              label: "المدراء",
              value: stats.admins,
              icon: Shield,
              color: "red",
            },
            {
              label: "أصحاب العمل",
              value: stats.owners,
              icon: Users,
              color: "emerald",
            },
            {
              label: "العملاء",
              value: stats.users,
              icon: Users,
              color: "emerald",
            },
            { label: "نشطون", value: stats.active, icon: Eye, color: "green" },

            {
              label: "التصنيفات",
              value: stats.categories || 0,
              icon: Layers,
              color: "purple",
              onClick: () => router.push("/AdminCategories"),
            },
            {
              label: "إجمالي الإعلانات",
              value: stats.ads,
              icon: Megaphone, // تحتاج لاستيراد الأيقونة
              color: "orange",
              onClick: () => router.push("/AdminAds"),
            },
            {
              label: "بإنتظار المراجعة",
              value: stats.pendingAds,
              icon: Clock,
              color: "yellow",
              onClick: () => router.push("/AdminAds?status=PENDING_REVIEW"),
            },
            {
              label: "إعلانات نشطة",
              value: stats.activeAds,
              icon: CheckCircle,
              color: "green",
              onClick: () => router.push("/AdminAds?status=APPROVED"),
            },
          ].map((stat, index) => (
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
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
          ,
        </motion.div>

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  placeholder="ابحث بالاسم أو اسم المستخدم أو  ..."
                  className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="relative">
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  className="pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white appearance-none min-w-[180px]"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">جميع الصلاحيات</option>
                  <option value="admin">مدير</option>
                  <option value="user">صاحب عمل</option>
                </select>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex gap-3">
              {selectedUsers.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={bulkDelete}
                  className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>حذف المحدد ({selectedUsers.length})</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Users Table/Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-right">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map((u: any) => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      checked={
                        selectedUsers.length === filteredUsers.length &&
                        filteredUsers.length > 0
                      }
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                    />
                  </th>
                  <th className="p-4 text-right text-gray-700 font-semibold">
                    المستخدم
                  </th>
                  <th className="p-4 text-right text-gray-700 font-semibold">
                    معلومات الاتصال
                  </th>
                  <th className="p-4 text-right text-gray-700 font-semibold">
                    الدور
                  </th>
                  <th className="p-4 text-right text-gray-700 font-semibold">
                    التاريخ
                  </th>
                  <th className="p-4 text-right text-gray-700 font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredUsers.map((user: any, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-all duration-300"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers((prev) => [...prev, user.id]);
                            } else {
                              setSelectedUsers((prev) =>
                                prev.filter((id) => id !== user.id)
                              );
                            }
                          }}
                          className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0) || user.username?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-900">
                          {user.phone || "غير محدد"}
                        </p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {user.role === "ADMIN" && <span>👑 مدير</span>}
                          {user.role === "OWNER" && <span>🏢 صاحب العمل</span>}
                          {user.role === "USER" && <span>👤 مستخدم</span>}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleClick(user.id)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
                          >
                            <Edit3 className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => deleteUser(user.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {/* Empty State */}
          {filteredUsers.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                لا توجد نتائج
              </h3>
              <p className="text-gray-600 mb-6">
                جرب تغيير كلمة البحث أو نوع الصلاحية
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearch("");
                  setFilterRole("all");
                }}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors duration-300"
              >
                إعادة تعيين الفلتر
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}