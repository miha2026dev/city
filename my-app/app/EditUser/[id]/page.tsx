"use client";

import { useEffect, useState } from "react";
import Axios from "@/app/utilts/Axios";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Shield, 
  Phone, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Mail,
  Key,
  Calendar
} from "lucide-react";
import SummaryApi from "@/app/common/SummaryApi";

interface UserForm {
  id?: string;
  username: string;
  name: string;
  phone: string;
  role: "admin" | "user";
  password: string;
  createdAt: string;
}

export default function EditUser() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<UserForm>({
  username: "",
  name: "",
  phone: "",
  role: "user",
  password: "",
  createdAt: ""
});

  const [originalData, setOriginalData] = useState<any>(null);

const fetchUser = async () => {
  try {
    const res = await Axios({
      ...SummaryApi.user.getUserById(`${id}`)
    })
    if (res.data.ok) {
      setForm({ ...res.data.data, password: "" });
      setOriginalData(res.data.data);
    } else {
      toast.error("فشل في جلب بيانات المستخدم");
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || "خطأ في الاتصال بالخادم");
  } finally {
    setLoading(false);
  }
};

  const saveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await Axios({
        ...SummaryApi.user.updateUser(`${id}`),
        data:{
           username: form.username,
        name: form.name,
        phone: form.phone,
        role: form.role,
        ...(form.password && { password: form.password })
        }
       
      })
   
      
   

      if (res.data.ok) {
        toast.success("✅ تم تحديث بيانات المستخدم بنجاح");
        setTimeout(() => {
          router.push("/AdminController");
        }, 1000);
      } else {
        toast.error(res.data.message || "فشل في تحديث البيانات");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطأ في الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm({ ...originalData, password: "" });
    toast.success("تم استعادة البيانات الأصلية");
  };

  const hasChanges = () => {
    if (!originalData || !form) return false;
    return (
      form.username !== originalData.username ||
      form.name !== originalData.name ||
      form.phone !== originalData.phone ||
      form.role !== originalData.role ||
      form.password !== ""
    );
  };

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-cairo">جاري تحميل بيانات المستخدم...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2 font-cairo">المستخدم غير موجود</h3>
          <p className="text-gray-600 mb-6">تعذر العثور على بيانات المستخدم المطلوب</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/admin")}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-medium hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg"
          >
            العودة للوحة التحكم
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 font-cairo" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/admin")}
                className="p-3 bg-white rounded-2xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </motion.button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-900 to-emerald-700 bg-clip-text text-transparent">
                  تعديل بيانات المستخدم
                </h1>
                {/* <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-600">ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded-lg">#{form.id}</span></p>
                  <p className="text-gray-600">•</p>
                  <p className="text-gray-600">أنشئ في: {new Date(form.createdAt).toLocaleDateString('ar-SA')}</p>
                </div> */}
              </div>
            </div>

            {hasChanges() && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetForm}
                className="flex items-center gap-2 px-6 py-3 text-orange-600 bg-orange-50 rounded-2xl hover:bg-orange-100 transition-all duration-300 border border-orange-200"
              >
                <RefreshCw className="w-5 h-5" />
                استعادة التغييرات
              </motion.button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                  {form.name?.charAt(0) || form.username?.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{form.name}</h3>
                <p className="text-gray-600 mb-2">@{form.username}</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  form.role === 'admin' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {form.role === 'admin' ? '👑 مدير نظام' : '💼 صاحب عمل'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">اسم المستخدم</p>
                    <p className="font-medium text-gray-900">{form.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                    <p className="font-medium text-gray-900">{form.phone || "غير محدد"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">تاريخ الإنشاء</p>
                    <p className="font-medium text-gray-900">
                      {new Date(form.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Edit Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <form onSubmit={saveChanges} className="p-6 space-y-8">
                {/* Basic Information Section */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    المعلومات الأساسية
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        اسم المستخدم *
                      </label>
                      <input
                        name="username"
                        type="text"
                        required
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                        value={form.username}
                        onChange={handleInputChange}
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        الاسم الكامل *
                      </label>
                      <input
                        name="name"
                        type="text"
                        required
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                        value={form.name}
                        onChange={handleInputChange}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    معلومات الاتصال
                  </h2>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف *
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      required
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                      value={form.phone}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Security & Permissions */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    الأمان والصلاحيات
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        نوع الصلاحية *
                      </label>
                      <select
                        name="role"
                        required
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white appearance-none"
                        value={form.role}
                        onChange={handleInputChange}
                        disabled={saving}
                      >
                        <option value="user">صاحب عمل</option>
                        <option value="admin">مدير نظام</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        كلمة المرور الجديدة
                      </label>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                          placeholder="أدخل كلمة مرور جديدة"
                          value={form.password}
                          onChange={handleInputChange}
                          disabled={saving}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        اترك الحقل فارغاً للحفاظ على كلمة المرور الحالية
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/admin")}
                    disabled={saving}
                    className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إلغاء
                  </motion.button>
                  
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={saving || !hasChanges()}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-medium hover:from-emerald-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {saving ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        حفظ التغييرات
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-3 text-lg">ملاحظات هامة</h4>
                  <ul className="text-blue-800 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>التغييرات ستطبق فوراً بعد الحفظ</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>يمكنك تغيير كلمة المرور أو تركها كما هي</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>تغيير الصلاحية قد يؤثر على صلاحيات المستخدم</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}