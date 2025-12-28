import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Banner {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  business?: {
    name: string;
    slug: string;
  };
}

export default function HeroWithBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // جلب البيانات من API
   useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/banners?type=MAIN_HERO');
        const data = await response.json();
        setBanners(data);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []); 

  // التبديل التلقائي
 useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // كل 5 ثواني

    return () => clearInterval(interval);
  }, [banners.length]); 

 /*  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  }; */

 /*  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  }; */

  if (isLoading) {
    return <div className="h-96 bg-gray-200 animate-pulse"></div>;
  }

  if (banners.length === 0) {
    return (
      <div className="hero-default">
        {/* الهيرو الافتراضي إذا لم يكن هناك banners */}
      </div>
    );
  }

  return (
    <section className="relative h-96 md:h-[500px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full h-full"
        >
          {/* الصورة الخلفية */}
          <picture>
            <source 
              media="(max-width: 768px)" 
              srcSet={banners[currentBanner].mobileImageUrl || banners[currentBanner].imageUrl} 
            />
           {/*  <source 
              media="(min-width: 769px) and (max-width: 1024px)" 
              srcSet={banners[currentBanner].tabletImageUrl || banners[currentBanner].imageUrl} 
            /> */}
            <img
              src={banners[currentBanner].imageUrl}
              alt={banners[currentBanner].title}
              className="w-full h-full object-cover"
            />
          </picture>

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>

          {/* المحتوى */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 text-white">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl"
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  {banners[currentBanner].title}
                </h1>
                {banners[currentBanner].description && (
                  <p className="text-xl md:text-2xl mb-6 opacity-90">
                    {banners[currentBanner].description}
                  </p>
                )}
                {banners[currentBanner].ctaText && (
                  <button className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-colors">
                    {banners[currentBanner].ctaText}
                  </button>
                )}
              </motion.div>
            </div>
          </div>

          {/* أزرار التنقل */}
          {banners.length > 1 && (
            <>
              <button
               /*  onClick={prevBanner} */
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
               /*  onClick={nextBanner} */
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* النقاط التوضيحية */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentBanner ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}