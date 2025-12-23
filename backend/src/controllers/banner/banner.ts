// pages/api/banners.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, BannerType } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type = 'MAIN_HERO' } = req.query;

  // التحقق من صحة نوع البانر
  const validBannerTypes = Object.values(BannerType);
  if (!validBannerTypes.includes(type as BannerType)) {
    return res.status(400).json({ 
      message: 'نوع البانر غير صالح',
      validTypes: validBannerTypes 
    });
  }

  try {
    const now = new Date();

    // تحسين الاستعلام مع where شرطية
    const whereCondition: any = {
      bannerType: type as BannerType,
      isActive: true,
      status: 'APPROVED', // إضافة هذا الشرط بناءً على الكود السابق
    };

    // إضافة شروط التواريخ فقط إذا كانت موجودة في قاعدة البيانات
    const adWithDates = await prisma.ad.findFirst({
      where: { bannerType: type as BannerType },
      select: { startAt: true, endAt: true }
    });

    if (adWithDates?.startAt || adWithDates?.endAt) {
      whereCondition.startAt = { lte: now };
      whereCondition.endAt = { gte: now };
    }

    const banners = await prisma.ad.findMany({
      where: whereCondition,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    });

    // تحديث الـ impressions بشكل غير متزامن
    if (banners.length > 0) {
      const updatePromises = banners.map(banner =>
        prisma.ad.update({
          where: { id: banner.id },
          data: { impressions: { increment: 1 } },
        })
      );
      Promise.all(updatePromises).catch(error => 
        console.error('Error updating impressions:', error)
      );
    }

    res.status(200).json({
      success: true,
      data: banners,
      count: banners.length,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    
    // رسالة خطأ أكثر وصفية
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'حدث خطأ غير معروف';
    
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  } finally {
    // إغلاق اتصال Prisma في بيئة serverless
    await prisma.$disconnect();
  }
}