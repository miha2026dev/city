import { Request, Response } from "express";
import { PrismaClient, AdTargetType, BannerType } from "@prisma/client";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/uploadToCloudinary";
import { validateAdInput } from "../../middlewares/validateRequest";
import { ok } from "assert";


const prisma = new PrismaClient();
const ALLOWED_SORT_FIELDS = ["createdAt", "priority", "clicks", "impressions"];

export const adController = {
  /* ======================================================
     CREATE AD
  ====================================================== */
 async createAd(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const data = req.body;
    const startAt = data.startAt ? new Date(data.startAt) : null;
    const endAt   = data.endAt ? new Date(data.endAt) : null; 
     const businessId = Number(data.targetId);
    if (!["ADMIN", "OWNER"].includes(user.role)) {
      return res.status(403).json({ message: "غير مصرح" });
    }

    // ========== التحقق بناءً على الدور ==========
    
    if (user.role === "ADMIN") {
      // المدير يمكنه إنشاء إعلانات SYSTEM فقط
      if (data.targetType !== "EXTERNAL") {
        return res.status(400).json({ 
          message: "المدير يمكنه إنشاء إعلانات نظامية فقط" 
        });
      }
      data.targetId = null; // لا يوجد متجر
    }
    
    if (user.role === "OWNER") {
      // صاحب العمل يمكنه إنشاء إعلانات BUSINESS فقط
      if (data.targetType !== "BUSINESS") {
        return res.status(400).json({ 
          message: "صاحب العمل يمكنه إنشاء إعلانات لمتجره فقط" 
        });
      }
      
      // التحقق من أن المتجر يخصه
     
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business) {
        return res.status(404).json({ message: "المتجر غير موجود" });
      }

      if (business.ownerId !== user.id) {
        return res.status(403).json({ 
          message: "لا يمكنك الإعلان لمتجر لا تملكه" 
        });
      }
    }

      // رفع الصور مرة واحدة فقط
      let imageUrl: string | undefined;
      let mobileImageUrl: string | undefined;
      let tabletImageUrl: string | undefined;

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      if (files?.image?.[0]) {
        imageUrl = (await uploadToCloudinary(files.image[0])).secure_url;
      }
      if (files?.mobileImage?.[0]) {
        mobileImageUrl = (await uploadToCloudinary(files.mobileImage[0])).secure_url;
      }
      if (files?.tabletImage?.[0]) {
        tabletImageUrl = (await uploadToCloudinary(files.tabletImage[0])).secure_url;
      }

      const ad = await prisma.ad.create({
        data: {
          title: data.title,
          content: data.content,
          imageUrl,
          mobileImageUrl,
          tabletImageUrl,
          ctaText: data.ctaText,
          ctaUrl: data.ctaUrl,
          backgroundColor: data.backgroundColor,
          textColor: data.textColor,
          bannerType: data.bannerType ?? BannerType.MAIN_HERO,
          targetType: data.targetType,
          targetId: businessId,
          url: data.url,
          startAt,
          endAt,
          status: "PENDING_REVIEW",
          isActive: false,
          priority: 0,
        },
      });

      res.status(201).json({ message: "تم إنشاء الإعلان", ad });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "خطأ داخلي", error: err.message });
    }
  },


  /* ======================================================
     GET ALL ADS (ADMIN / OWNER)
  ====================================================== */
  async getAllAds(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const {
        page = 1,
        limit = 20,
        status,
        bannerType,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query as any;

      if (!["ADMIN", "OWNER"].includes(user.role)) {
        return res.status(403).json({ message: "غير مصرح" });
      }

      if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
        return res.status(400).json({ message: "حقل الترتيب غير مسموح" });
      }

      const where: any = {};

      if (status) where.status = status;
      if (bannerType) where.bannerType = bannerType;

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ];
      }

      if (user.role === "OWNER") {
        where.business = { ownerId: user.id };
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [ads, total] = await prisma.$transaction([
        prisma.ad.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy]: sortOrder },
          include: {
            business: { select: { id: true, name: true } },
          },
        }),
        prisma.ad.count({ where }),
      ]);

      res.json({
        ads,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "خطأ داخلي" });
    }
  },

  /* ======================================================
   GET AD BY ID
====================================================== */
async getAdById(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);

    const ad = await prisma.ad.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true, logo: true } },
      },
    });

    if (!ad) {
      return res.status(404).json({ message: "الإعلان غير موجود" });
    }

    // تحقق من الصلاحية للمالك
    if (user.role === "OWNER") {
      if (ad.targetType !== "BUSINESS" || !ad.targetId) {
        return res.status(403).json({ message: "غير مصرح" });
      }
      
      const business = await prisma.business.findUnique({
        where: { id: ad.targetId },
      });
      
      if (!business || business.ownerId !== user.id) {
        return res.status(403).json({ message: "غير مصرح" });
      }
    }

    res.json({ ad });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "خطأ داخلي" });
  }
},


  /* ======================================================
     UPDATE AD
  ====================================================== */
  async updateAdStatus(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    const { status, rejectionReason } = req.body;

    // للادمن فقط
    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "غير مصرح" });
    }

    if (!["APPROVED", "REJECTED", "PENDING_REVIEW"].includes(status)) {
      return res.status(400).json({ message: "حالة غير صالحة" });
    }

    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) return res.status(404).json({ message: "الإعلان غير موجود" });

    const updateData: any = { status };
    if (status === "REJECTED" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    if (status === "APPROVED") {
      updateData.isActive = true;
    }

    const updated = await prisma.ad.update({
      where: { id },
      data: updateData,
    });

    res.json({ message: `تم ${status === "APPROVED" ? "الموافقة" : "الرفض"}`, ad: updated });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "خطأ داخلي" });
  }
},


/* ======================================================
   INCREMENT CLICKS
====================================================== */
async incrementClicks(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    await prisma.ad.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });

    res.json({ message: "تم تحديث النقرات" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "خطأ داخلي" });
  }
},


/* ======================================================
   GET ADS BY BUSINESS (OWNER)
====================================================== */
async getMyAds(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 20, status } = req.query as any;

    if (user.role !== "OWNER") {
      return res.status(403).json({ message: "غير مصرح" });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where: {
          targetType: "BUSINESS",
          business: { ownerId: user.id },
          ...(status && { status }),
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          business: { select: { id: true, name: true } },
        },
      }),
      prisma.ad.count({
        where: {
          targetType: "BUSINESS",
          business: { ownerId: user.id },
          ...(status && { status }),
        },
      }),
    ]);
 
    res.json({
      ads,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "خطأ داخلي" });
  }
},


/* ======================================================
   GET ACTIVE ADS BY BANNER TYPE
====================================================== */
async getAdsByType(req: Request, res: Response) {
  try {
    const { type } = req.params;
    const now = new Date();

    if (!Object.values(BannerType).includes(type as BannerType)) {
      return res.status(400).json({ message: "نوع البانر غير صالح" });
    }

    const ads = await prisma.ad.findMany({
      where: {
        bannerType: type as BannerType,
        isActive: true,
        status: "APPROVED",
        startAt: { lte: now },
        endAt: { gte: now },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
    });

    // تحديث الـimpressions بشكل غير متزامن بدون انتظار
    if (ads.length > 0) {
      const updatePromises = ads.map(ad =>
        prisma.ad.update({
          where: { id: ad.id },
          data: { impressions: { increment: 1 } },
        })
      );
      Promise.all(updatePromises).catch(console.error); // لا نعيق الاستجابة
    }

    res.json({ ads });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "خطأ داخلي" });
  }
},

  /* ======================================================
     DELETE AD
  ====================================================== */
  async deleteAd(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = Number(req.params.id);

      const ad = await prisma.ad.findUnique({ where: { id } });
      if (!ad) return res.status(404).json({ message: "غير موجود" });

      if (user.role !== "ADMIN") {
        return res.status(403).json({ message: "للمدير فقط" });
      }

      await prisma.ad.delete({ where: { id } });
      res.json({ message: "تم الحذف" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "خطأ داخلي" });
    }
  },

  /* ======================================================
   UPDATE AD (FULL UPDATE)
====================================================== */
async updateAd(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    const data = req.body;

    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) return res.status(404).json({ message: "الإعلان غير موجود" });

    // تحقق من الصلاحيات
    if (user.role === "OWNER") {
      if (ad.targetType !== "BUSINESS" || !ad.targetId) {
        return res.status(403).json({ message: "غير مصرح" });
      }
      
      const business = await prisma.business.findUnique({ 
        where: { id: ad.targetId } 
      });
      
      if (!business || business.ownerId !== user.id) {
        return res.status(403).json({ message: "غير مصرح" });
      }
      
      // المالك لا يمكنه تغيير بعض الحقول
      delete data.status;
      delete data.priority;
      delete data.isActive;
    }

    // معالجة التواريخ
    if (data.startAt) data.startAt = new Date(data.startAt);
    if (data.endAt) data.endAt = new Date(data.endAt);
    
    // التحقق من صحة التواريخ
    if (data.startAt && data.endAt && data.endAt <= data.startAt) {
      return res.status(400).json({ 
        message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية" 
      });
    }

    // معالجة الصور
    if (req.files) {
      const files = req.files as any;
      
      // حذف الصور القديمة من Cloudinary (إذا كانت موجودة)
      const deletePromises = [];
      if (files.image && ad.imageUrl) {
        deletePromises.push(deleteFromCloudinary(ad.imageUrl));
        data.imageUrl = (await uploadToCloudinary(files.image[0].path, "ads")).secure_url;
      }
      if (files.mobileImage && ad.mobileImageUrl) {
        deletePromises.push(deleteFromCloudinary(ad.mobileImageUrl));
        data.mobileImageUrl = (await uploadToCloudinary(files.mobileImage[0].path, "ads/mobile")).secure_url;
      }
      if (files.tabletImage && ad.tabletImageUrl) {
        deletePromises.push(deleteFromCloudinary(ad.tabletImageUrl));
        data.tabletImageUrl = (await uploadToCloudinary(files.tabletImage[0].path, "ads/tablet")).secure_url;
      }
      
      // تنفيذ الحذف بشكل غير متزامن
      Promise.all(deletePromises).catch(console.error);
    }

    const updated = await prisma.ad.update({
      where: { id },
      data,
    });

    res.json({ message: "تم تحديث الإعلان بنجاح", ad: updated });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "خطأ داخلي", error: err.message });
  }
},

  /* ======================================================
     PUBLIC ADS
  ====================================================== */
  async getPublicAds(req: Request, res: Response) {
    try {
      const now = new Date();

      const ads = await prisma.ad.findMany({
        where: {
          isActive: true,
          status: "APPROVED", // ✅ string literal
          startAt: { lte: now },
          endAt: { gte: now },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 10,
      });

      await prisma.ad.updateMany({
        where: { id: { in: ads.map(a => a.id) } },
        data: { impressions: { increment: 1 } },
      });

      res.json({ ads });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "خطأ داخلي" });
    }
  },
};

export default adController;
