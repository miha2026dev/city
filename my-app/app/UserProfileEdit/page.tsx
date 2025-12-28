"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useRouter } from "next/navigation";
import Axios from "../utilts/Axios";
import SummaryApi from "../common/SummaryApi";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { motion } from "framer-motion";
import { User, Phone, Shield, Calendar, Edit3, LogOut, ArrowRight, Save } from "lucide-react";

interface StoreUser {
  id: number;
  username: string;
  name?: string;
  role: "USER";
  accessToken: string;
}

export default function EditProfilePage() {
  const user = useSelector((state: RootState) => state.user.user) as StoreUser | null;
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    bio: "",
    avatarUrl: "",
    isActive: false,
    lastLogin: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/Login");
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await Axios({
          ...SummaryApi.user.getUserById(user.id),
          headers: { Authorization: `Bearer ${user.accessToken}` }
        });
        setFormData({
          name: res.data.data.name || "",
          username: res.data.data.username || "",
          phone: res.data.data.phone || "",
          bio: res.data.data.bio || "",
          avatarUrl: res.data.data.avatarUrl || "",
          isActive: res.data.data.isActive,
          lastLogin: res.data.data.lastLogin,
        });
      } catch (err: any) {
        console.error(err.response?.data || err.message);
        toast.error("حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await Axios({
        ...SummaryApi.user.updateUser(user!.id),
        headers: { Authorization: `Bearer ${user!.accessToken}` },
        data: formData,
      });

      toast.success("✅ تم تحديث الملف الشخصي بنجاح");
      router.push("/Profile");
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      toast.error("فشل تحديث الملف الشخصي");
    } finally {
      setSaving(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-cairo p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
                تعديل الملف الشخصي
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                قم بتحديث معلومات حسابك الشخصية
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/Profile")}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-lg"
            >
              <ArrowRight className="w-4 h-4" />
              العودة للملف الشخصي
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="relative mx-auto mb-4">
                  {formData.avatarUrl ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto">
                      <Image
                        src={formData.avatarUrl}
                        alt="avatar"
                        width={96}
                        height={96}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto">
                      {formData.name?.charAt(0) || formData.username.charAt(0)}
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {formData.name || formData.username}
                </h2>
                <p className="text-gray-500 text-sm">@{formData.username}</p>
              </div>

              {/* Info */}
              <div className="space-y-3 text-sm text-gray-600 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>مستخدم عادي</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formData.lastLogin 
                      ? `آخر دخول: ${new Date(formData.lastLogin).toLocaleDateString('ar-SA')}`
                      : "لم يسجل دخول بعد"
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>الحالة: {formData.isActive ? "نشط" : "غير نشط"}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">الاسم الكامل</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">اسم المستخدم</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">رقم الهاتف</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">نبذة عنك</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-gray-50 focus:bg-white resize-none"
                    placeholder="اكتب نبذة مختصرة عن نفسك..."
                  />
                </div>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      حفظ التعديلات
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}