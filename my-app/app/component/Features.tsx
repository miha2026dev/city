import { motion } from 'framer-motion';

export default function Features() {
    return(
        <section className="py-20 bg-gradient-to-b from-black/90 to-black/95 backdrop-blur-lg font-cairo">
            <div className="max-w-7xl mx-auto px-4">
                
                {/* العنوان المعدل */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-5xl font-black text-center mb-16 text-white"
                >
                    لماذا تختار <span className="text-yellow-500">مدينتك</span>؟
                </motion.h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "خريطة حية",
                            description: "استكشف الأماكن على خريطة تفاعلية مع تحديثات حية ومسارات مخصصة",
                            icon: "🗺️",
                            color: "from-green-500 to-emerald-500",
                            borderColor: "hover:border-green-400/30"
                        },
                        {
                            title: "توصيات ذكية",
                            description: "احصل على توصيات مخصصة بناءً على اهتماماتك وتفضيلاتك الشخصية",
                            icon: "🤖",
                            color: "from-yellow-500 to-amber-500",
                            borderColor: "hover:border-yellow-400/30"
                        },
                        {
                            title: "حجوزات سريعة",
                            description: "احجز في أفضل الأماكن والفعاليات بضغطة واحدة وبسهولة تامة",
                            icon: "⚡",
                            color: "from-blue-500 to-cyan-500",
                            borderColor: "hover:border-blue-400/30"
                        },
                    ].map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ 
                                delay: index * 0.2,
                                type: "spring",
                                stiffness: 100
                            }}
                            whileHover={{ 
                                scale: 1.05,
                                y: -8
                            }}
                            className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 ${feature.borderColor} transition-all duration-300 group shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-yellow-500/10`}
                        >
                            
                            {/* الأيقونة المعدلة */}
                            <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}>
                                {feature.icon}
                            </div>
                            
                            {/* العنوان */}
                            <h3 className="text-xl md:text-2xl font-black text-white mb-4 group-hover:text-yellow-400 transition-colors">
                                {feature.title}
                            </h3>
                            
                            {/* الوصف */}
                            <p className="text-white/70 leading-relaxed text-lg">
                                {feature.description}
                            </p>

                            {/* تأثير خلفي عند Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`}></div>
                        </motion.div>
                    ))}
                </div>

                {/* فاصل زخرفي */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex justify-center mt-16"
                >
                    <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent w-1/3"></div>
                </motion.div>
            </div>
        </section>
    )
}