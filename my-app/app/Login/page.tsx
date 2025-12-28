'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Lock, Eye, EyeOff, User } from 'lucide-react';
import Link from 'next/link';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utilts/Axios';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../store/userSlice';
import { useRouter } from 'next/navigation';
import { RootState } from '../store/store';
export default function Login() {
  const dispatch=useDispatch();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const user = useSelector((state: RootState) => state.user.user);
 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const form = e.currentTarget;

  const username = (form.elements.namedItem("username") as HTMLInputElement).value;
  const password = (form.elements.namedItem("password") as HTMLInputElement).value;

  try {
    const response = await Axios({
      ...SummaryApi.user.login,
      data: { username, password },
    });

    localStorage.setItem("accessToken", response.data.accessToken);
    localStorage.setItem("refreshToken", response.data.refreshToken);

    dispatch(
      setCredentials({
        user: {
          ...response.data.user,
          accessToken: response.data.accessToken,
        },
      })
    );

    form.reset();
    router.push("/");
  } catch (err: any) {
    console.error("خطأ:", err.response?.data || err.message);
  }
};


 

  return (
    <div className="relative flex min-h-screen items-center justify-center w-full overflow-visible bg-gradient-to-br from-blue-950 to-purple-950 px-3 md:px-auto">
      {/* Particles Background */}

      {/* كارد تسجيل الدخول */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-10 w-full max-w-md border border-white/20 shadow-2xl"
        dir="rtl"
      >
        {/* العنوان */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <LogIn className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">تسجيل الدخول</h1>
          <p className="text-white/70">مرحباً بعودتك!</p>
        </div>

        {/* الفورم */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* اسم المستخدم */}
          <div>
            <label className="block text-white/80 mb-2 text-right">
              اسم المستخدم
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                name="username"
                type="text"
                placeholder="اسم المستخدم"
                className="w-full bg-white/10 border border-white/20 rounded-xl pr-12 pl-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all text-right"
                required
              />
            </div>
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="block text-white/80 mb-2 text-right">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-xl pr-12 pl-12 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all text-right"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* زر تسجيل الدخول */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg hover:shadow-2xl transition-all"
          >
            تسجيل الدخول
          </motion.button>
        </form>

        {/* روابط إضافية */}
      
          <div className="text-center mt-6">
            <span className="text-white/70">ليس لديك حساب؟ </span>
            <Link
              href="/Register"
              className="text-cyan-300 hover:text-cyan-200 font-medium transition-colors"
            >
              إنشاء حساب جديد
            </Link>
          </div>
       
      </motion.div>
    </div>
  );
}
