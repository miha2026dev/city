import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo.png'
import { Menu, X, User, LogIn, Settings, icons, Tag, User2Icon } from "lucide-react"; // أضفت Settings
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Axios from '../utilts/Axios';
import SummaryApi from '../common/SummaryApi';
import { count } from 'console';
interface Category {
  id: number;
  name: string;
  slug: string;
  businessCount?: number;
}
export default function Header() {
    const [open, setOpen] = useState(false);
    const user = useSelector((state: RootState) => state.user.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    
   const navItems = [
  { name: "الأعمال", href: "/businesses" },
  { name: "الفئات", 
    href: "#",
    icon: <Tag className='w-4 h-4' />,
    dropdown: loading ? [] :[
      ...categories.slice(0,6).map(cat=>({
        name:cat.name,
        href:`/category/${cat.slug}`,
        count:cat.businessCount || 0
      }))
    ]

   },
  { name: "الأحداث", href: "/events" },
  { name: "الوظائف", href: "/jobs" },
  { name: "المحترفين", href: "/professionals" },
  { name: "التبرع بالدم", href: "/blood-requests" },
  { name: "المسابقات", href: "/competitions" },
  { name: "الخريطة", href: "/map" }
];

    {/**fetch categories */}
   const fetchCategories = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.category.get_categories
      });


      if (response.data?.success) {
        // يمكنك إضافة عدد الأعمال لكل فئة إذا كان متوفراً في الـ API
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{
    fetchCategories()
  },[])
    // 🔥 التحقق إذا كان المستخدم مدير
    const role = user?.role?.toLowerCase();
    const isAdmin = role === "admin";
    const isOwner = role === "owner";
    const isUser = role === "user";
    return (
      <header className="font-cairo fixed top-0 w-full bg-black/30 backdrop-blur-lg z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4 md:p-6">
          {/* الشعار */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <Link href="/" className="inline-flex items-center space-x-3">
              <Image
                src={logo}
                alt="شعار دليل المدينة"
                width={40}
                height={32}
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                دليل المدينة
              </span>
            </Link>
          </motion.div>

          {/* القائمة الرئيسية - سطح المكتب */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.div key={item.name} whileHover={{ scale: 1.05 }}>
                <Link
                  href={item.href}
                  className="text-white/80 hover:text-white transition-all font-medium text-sm lg:text-base"
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}

            {/* 🔥 اذا كان مسجل دخول */}
            {user ? (
              <>
                {isAdmin && (
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      href="/AdminController"
                      className="flex items-center space-x-2 bg-green-600 hover:bg-purple-700 rounded-xl px-4 py-2 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-cairo text-amber-200">
                        إدارة النظام
                      </span>
                    </Link>
                  </motion.div>
                )}

                {isOwner && (
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      href="/Owner"
                      className="flex items-center space-x-2 bg-green-600 hover:bg-purple-700 rounded-xl px-4 py-2 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-cairo text-amber-200">
                        إداره حسابك
                      </span>
                    </Link>
                  </motion.div>
                )}

                {isUser && (
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      href="/Profile"
                      className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 rounded-xl px-2 py-2 transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-cairo text-amber-200">
                        الملف الشخصي
                      </span>
                    </Link>
                  </motion.div>
                )}
              </>
            ) : (
              // 🔥 اذا ما في مستخدم
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link
                  href="/Login"
                  className="flex items-center space-x-2 bg-green-600 hover:bg-purple-700 rounded-xl px-4 py-2 transition-all"
                >
                  <span className="text-sm font-cairo text-amber-200">
                    تسجيل الدخول
                  </span>
                </Link>
              </motion.div>
            )}
          </nav>

          {/* زر القائمة - الجوال */}
          <div className='flex items-center justify-center '>
            <div className="md:hidden flex items-center space-x-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(true)}
                className="p-2 bg-white/10 rounded-lg"
                aria-label="فتح القائمة"
              >
                <Menu className="w-6 h-6 text-white" />
              </motion.button>
            </div>
            {/* زر الدخول */}
           <div className='md:hidden flex items-center space-x-3 '>
             <Link
              href="/Login"
              onClick={() => setOpen(false)}
              className="absolute ml-7  left-7 p-2 rounded-xl hover:bg-red-500/20 transition-all duration-200 z-50"
            >
              <User2Icon className="w-6 h-6" />
            </Link>
           </div>
          </div>
        </div>

        {/* القائمة الجانبية - الجوال */}
        <AnimatePresence>
          {open && (
            <>
              {/* overlay لتعتيم الخلفية */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40 md:hidden"
                onClick={() => setOpen(false)}
              />

              {/* القائمة الجانبية */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "tween",
                  duration: 0.3,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="fixed top-0 right-0 w-80 h-full z-50 md:hidden bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col relative"
                dir="rtl"
              >
                {/* زر الإغلاق */}
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-6 left-6 p-2 rounded-xl hover:bg-red-500/20 transition-all duration-200 z-50"
                  aria-label="إغلاق القائمة"
                >
                  <X className="w-6 h-6 text-white" />
                </button>

                {/* الهيدر الداخلي */}
                <div className="flex items-center space-x-3 mb-8 pt-2 border-b border-white/10 pb-6 relative z-10">
                  <Image
                    src={logo}
                    alt="شعار دليل المدينة"
                    width={32}
                    height={26}
                  />
                  <span className="text-lg font-bold text-white">
                    دليل المدينة
                  </span>
                </div>

                {/* عناصر القائمة */}
                <nav className="space-y-3 mb-6 flex-1 relative z-10">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center text-white/90 hover:text-white transition-all font-medium py-3 px-4 rounded-xl hover:bg-white/10"
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}

                  {/* 🔥 رابط لوحة التحكم في الجوال - يظهر فقط للمدير */}
                  {isAdmin && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: navItems.length * 0.1 }}
                    >
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="flex items-center space-x-3 text-white/90 hover:text-white transition-all font-medium py-3 px-4 rounded-xl hover:bg-purple-600/30"
                      >
                        <Settings className="w-5 h-5" />
                        <span>لوحة التحكم</span>
                      </Link>
                    </motion.div>
                  )}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    );
}