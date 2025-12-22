"use client";

import { useState } from "react";
import Axios from "../utilts/Axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus, Shield, User } from "lucide-react";
import SummaryApi from "../common/SummaryApi";

export default function AddUser() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    name: "",
    phone: "",
    password: "",
    role:""
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // التحقق من الحقول المطلوبة
    if (!form.username || !form.name || !form.phone || !form.password || !form.role) {
      toast.error("جميع الحقول مطلوبة");
      setLoading(false);
      return;
    }

    try {
      const res = await Axios({
        ...SummaryApi.user.craete,
        data:form
      })
     

      if (res.data.ok) {
        toast.success("✅ تمت إضافة المستخدم بنجاح");
        setForm({
          username: "",
          name: "",
          phone: "",
          password: "",
          role:""
        });
        // الانتقال بعد ثانيتين لإظهار رسالة النجاح
        setTimeout(() => {
          router.push("/AdminController");
        }, 1000);
      } else {
        toast.error(res.data.message || "حدث خطأ أثناء الإضافة");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4"
      dir="rtl"
    >
      <div className="max-w-md mx-auto">
        {/* رأس الصفحة */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-cairo">
            إضافة مستخدم جديد
          </h1>
          <p className="text-gray-600 text-lg">أضف مستخدم جديد إلى النظام</p>
        </motion.div>

        {/* البطاقة الرئيسية */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <form onSubmit={submit} className="p-6 space-y-6">
            {/* حقل اسم المستخدم */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 ml-2" />
                اسم المستخدم
              </label>
              <input
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="أدخل اسم المستخدم..."
                value={form.username}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {/* حقل الاسم الكامل */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 ml-2" />
                الاسم الكامل
              </label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="أدخل الاسم الكامل..."
                value={form.name}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {/* حقل الهاتف */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                رقم الهاتف
              </label>
              <input
                name="phone"
                type="tel"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="أدخل رقم الهاتف..."
                value={form.phone}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {/* حقل كلمة المرور */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                كلمة المرور
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="أدخل كلمة المرور..."
                value={form.password}
                onChange={handleInputChange}
                disabled={loading}
                minLength={6}
              />
            </div>

            {/** حقل دور المستخدم */}
            <select
              name="role"
              required
              className="w-full px-4 py-3 border bg-gray-50 rounded-xl"
              value={form.role}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="">اختر الدور</option>
              <option value="OWNER">صاحب عمل</option>
              <option value="USER">مستخدم عادي</option>
              {/* لو تبي المدير يضيف مديرين آخرين */}
              {/* <option value="ADMIN">مدير</option> */}
            </select>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 pt-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/AdminController")}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </motion.button>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    إضافة المستخدم
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* معلومات إضافية */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          <p>سيتم إضافة المستخدم إلى النظام فور الضغط على زر الإضافة</p>
        </motion.div>
      </div>
    </div>
  );
}