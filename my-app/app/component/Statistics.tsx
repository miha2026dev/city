import { motion } from 'framer-motion';
import { MapPin, Star, Calendar, Users } from 'lucide-react';

export default function Statistics() {
  return (
    <section className="relative py-16 bg-gradient-to-b from-black/80 to-black/90 backdrop-blur-lg border-t border-yellow-500/20">
      
      {/* خلفية متحركة خفيفة */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent"></div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        
        {/* عنوان القسم */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4 font-cairo">
            <span className="text-yellow-500">أرقام</span> تتحدث عن نفسها
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            انضم إلى آلاف المستخدمين الذين يكتشفون مدينتهم كل يوم
          </p>
        </motion.div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { 
              icon: Users, 
              number: "10K+", 
              label: "مستخدم نشط",
              color: "from-blue-500 to-cyan-500"
            },
            { 
              icon: MapPin, 
              number: "2K+", 
              label: "مكان متميز",
              color: "from-green-500 to-emerald-500"
            },
            { 
              icon: Star, 
              number: "50K+", 
              label: "تقييم",
              color: "from-yellow-500 to-amber-500"
            },
            { 
              icon: Calendar, 
              number: "500+", 
              label: "فعالية شهرية",
              color: "from-purple-500 to-pink-500"
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.15,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{
                y: -5,
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              className="relative group"
            >
              {/* الخلفية */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 shadow-lg shadow-black/20 hover:shadow-yellow-500/10 transition-all duration-300">
                
                {/* أيقونة */}
                <div className={`bg-gradient-to-r ${stat.color} w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                
                {/* الرقم */}
                <div className="text-2xl md:text-3xl font-black text-white mb-2 text-center">
                  {stat.number}
                </div>
                
                {/* التسمية */}
                <div className="text-white/80 text-sm md:text-base text-center font-medium">
                  {stat.label}
                </div>
              </div>
              
              {/* تأثير ظل خفيف */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-md"></div>
            </motion.div>
          ))}
        </div>

        {/* فاصل زخرفي */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          whileInView={{ opacity: 1, width: "100%" }}
          transition={{ delay: 0.8, duration: 1 }}
          className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mt-12 mx-auto max-w-md"
        ></motion.div>
      </div>
    </section>
  );
}