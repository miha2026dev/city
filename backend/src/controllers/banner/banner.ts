// pages/api/banners.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type = 'MAIN_HERO' } = req.query;

  try {
    const banners = await prisma.ad.findMany({
      where: {
        bannerType: type,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        business: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10, // أقصى 10 banners
    });

    res.status(200).json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}