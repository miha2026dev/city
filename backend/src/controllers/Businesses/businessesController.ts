
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ok } from "assert";
import { deleteFromCloudinary, uploadToCloudinary } from "../../utils/uploadToCloudinary";

const prisma = new PrismaClient();

/* ============================
   CREATE BUSINESS (OWNER ONLY)
============================ */


export const createBusiness = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // ⬅️ استخدم الـ id من middleware
    const {
      name,
      categoryId,
      description,
      tags,
      address,
      city,
      region,
      phone,
      mobile,
      website,
      openingHours,
    } = req.body;

    // 1. التحقق: هل المستخدم لديه عمل بالفعل؟
    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId: userId }
    });

    if (existingBusiness) {
      return res.status(400).json({
        ok: false,
        message: "لديك عمل مسجل بالفعل. يمكنك تعديله من لوحة التحكم.",
        existingBusinessId: existingBusiness.id
      });
    }

    // 2. التحقق من البيانات المطلوبة
    if (!name) {
      return res.status(400).json({
        ok: false,
        message: "اسم العمل مطلوب",
      });
    }

    // 3. توليد slug
    const generateSlug = (text: string) =>
      text
        .toString()
        .normalize("NFKD")
        .replace(/[^\w\s-\u0600-\u06FF]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();

    let slug = generateSlug(name);

    // تحقق من أن slug فريد
    const slugExists = await prisma.business.findUnique({ where: { slug } });
    if (slugExists) slug = `${slug}-${Date.now()}`;

    // 4. إنشاء العمل
    const business = await prisma.business.create({
      data: {
        ownerId: userId, // ⬅️ استخدم userId من middleware
        name,
        slug,
        description: description || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        tags: tags || "",
        address: address || null,
        city: city || null,
        region: region || null,
        phone: phone || null,
        mobile: mobile || null,
        website: website || null,
        openingHours: openingHours
          ? typeof openingHours === "string"
            ? JSON.parse(openingHours)
            : openingHours
          : {},
        status: "PENDING", // ⬅️ وضع افتراضي "قيد المراجعة"
      },
    });

    // 5. التعامل مع الصور
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const mediaData = files.map((file, index) => ({
      url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
        type: file.mimetype.startsWith("image") ? "IMAGE" : file.mimetype.startsWith("video") ? "VIDEO" : "DOCUMENT",
        altText: `${name} - صورة ${index + 1}`,
        title: `${name} - ${index + 1}`,
        order: index,
        businessId: business.id,
        publicId: null,
        description: null,
      }));

      try {
        await prisma.media.createMany({ data: mediaData, skipDuplicates: true });
      } catch (err) {
        console.error("خطأ أثناء حفظ الصور:", err);
      }
    }

    res.status(201).json({
      ok: true,
      message: "تم إنشاء العمل بنجاح وجاري مراجعته",
      data: business,
    });
  } catch (error: any) {
    console.error("خطأ في createBusiness:", error);

    let errorMessage = "حدث خطأ أثناء إنشاء العمل";
    if (error.code === "P2002") errorMessage = "اسم العمل مستخدم بالفعل";
    else if (error.code === "P2003") errorMessage = "المستخدم أو التصنيف غير موجود";
    else if (error.code === "P2025") errorMessage = "البيانات المرجعية غير موجودة";

    res.status(500).json({ ok: false, message: errorMessage });
  }
};


/* ============================
   GET OWNER BUSINESSES
============================ */
export const getOwnerBusinesses = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    // ⬇️ غيرت من findMany إلى findFirst لأن كل مستخدم له عمل واحد فقط
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
      include: {
        category: true,
        media: true,
        reviews: {
          include: {
            user: {
              select: { name: true, avatarUrl: true }
            }
          }
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            follows: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // ⬇️ إرجاع object بدلاً من array
    res.json({
      ok: true,
      message: business ? "تم جلب العمل بنجاح" : "ليس لديك عمل مسجل",
      data: business // ⬅️ object واحد وليس array
    });
  } catch (err: any) {
    res.status(500).json({ 
      ok: false,
      message: "حدث خطأ في جلب البيانات",
      error: err.message 
    });
  }
};

/* ============================
   GET  BUSINESSE by id
============================ */

// API جديد لجلب عمل محدد بالـ ID
export const getBusinessById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  try {
    const business = await prisma.business.findFirst({
      where: { 
        id: parseInt(id),
        ownerId: userId // تأكد أن المستخدم هو المالك
      },
      include: {
        category: true,
        media: true,
        // ... باقي الـ includes
      }
    });

    if (!business) {
      return res.status(404).json({
        ok: false,
        message: "العمل غير موجود أو ليس لديك صلاحية للوصول إليه"
      });
    }

    res.json({
      ok: true,
      data: business
    });
  } catch (err: any) {
    res.status(500).json({ 
      ok: false,
      message: "حدث خطأ في جلب البيانات",
      error: err.message 
    });
  }
};

/* ============================
   UPDATE BUSINESS (OWNER ONLY)
============================ */
export const updateBusiness = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const businessId = parseInt(req.params.id);
  const updateData = req.body;

  try {
    // التحقق من ملكية العمل
    const existingBusiness = await prisma.business.findFirst({
      where: { id: businessId, ownerId: userId },
      include: { media: true }
    });

    if (!existingBusiness) {
      return res.status(404).json({ message: "Business not found or access denied" });
    }

    // توليد slug جديد إذا تغير الاسم
    if (updateData.name && updateData.name !== existingBusiness.name) {
      updateData.slug = updateData.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    // معالجة الصور المراد حذفها
    // معالجة الصور المراد حذفها
let removed = updateData.removeImages;

// تأكد أنها مصفوفة
if (removed && !Array.isArray(removed)) {
  removed = [removed];
}

if (removed && removed.length > 0) {
  // أولاً: احصل على publicId لكل صورة للحذف من Cloudinary إذا أردت
  const medias = await prisma.media.findMany({
    where: {
      id: { in: removed.map((id: string | number) => parseInt(id)) },
      businessId
    }
  });

  for (const media of medias) {
    if (media.publicId) {
      await deleteFromCloudinary(media.publicId); // دالة لحذف الصورة من Cloudinary
    }
  }

  // ثم حذف الصور من قاعدة البيانات
  await prisma.media.deleteMany({
    where: {
      id: { in: removed.map((id: string | number) => parseInt(id)) },
      businessId
    }
  });
}

    // معالجة الصور الجديدة

  let newimages: any[]=[]
  let files:Express.Multer.File[]=[]
  if (Array.isArray(req.files)) {
  files = req.files as Express.Multer.File[];
}
// إذا كان multer fields
else if (req.files && (req.files as any).images) {
  files = (req.files as any).images;
}

// رفع الصور
for (const file of files) {
  const result = await uploadToCloudinary(file);
  newimages.push({
    url: result.secure_url,
    businessId
  });
}

    // تحديث العمل
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: updateData.name,
        slug: updateData.slug,
        description: updateData.description,
        phone: updateData.phone,
        address: updateData.address,
        city: updateData.city,
        website: updateData.website,
        openingHours: updateData.openingHours,
         categoryId: updateData.categoryId ? parseInt(updateData.categoryId) : null,
      },
      include: { media: true }
    });

    // إضافة الصور الجديدة
    if (newimages.length > 0) {
      await prisma.media.createMany({
        data: newimages
      });
    }

    res.json({ 
      ok: true,
      message: "Business updated successfully", 
      business 
    });
  } catch (err: any) {
    console.error(err);
    
    if (err.code === 'P2002') {
      return res.status(409).json({ 
        ok: false,
        message: "Business slug already exists" 
      });
    }
    
    res.status(400).json({ 
      ok: false,
      error: err.message 
    });
  }
};

/* ============================
   GET BUSINESS STATS (OWNER ONLY)
============================ */
export const getBusinessStats = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const businessId = parseInt(req.params.id);

  try {
    // Verify business ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: userId }
    });

    if (!business) {
      return res.status(404).json({ message: "Business not found or access denied" });
    }

    const stats = await prisma.businessStats.findMany({
      where: { businessId },
      orderBy: { date: 'desc' },
      take: 30 // Last 30 days
    });

    const reviews = await prisma.review.findMany({
      where: { businessId },
      include: {
        user: {
          select: { name: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const favoritesCount = await prisma.favorite.count({
      where: { businessId }
    });

    const followsCount = await prisma.follow.count({
      where: { businessId }
    });

    res.json({
      ok:true,
      message: "تم جلب الإحصائيات بنجاح",
      data:{
      business,
      stats,
      reviews,
      favoritesCount,
      followsCount,
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 ? 
      reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length : 0
      }
     
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**============================= */

export const deleteBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = parseInt(req.params.id);


    const result = await prisma.$transaction(async (tx) => {
      await tx.media.deleteMany({ where: { businessId } });
      await tx.event.deleteMany({ where: { businessId } });
      await tx.review.deleteMany({ where: { businessId } });
      await tx.favorite.deleteMany({ where: { businessId } });
      await tx.ad.deleteMany({ where: { targetId: businessId } });
      await tx.businessStats.deleteMany({ where: { businessId } });
      await tx.bookmark.deleteMany({ where: { businessId } });
      await tx.follow.deleteMany({ where: { businessId } });
      await tx.job.deleteMany({ where: { businessId } });

      const deletedBusiness = await tx.business.delete({
        where: { id: businessId }
      });

      return deletedBusiness;
    });

    res.status(200).json({
      success: true,
      message: "تم حذف العمل بنجاح",
      data: { id: result.id, name: result.name }
    });

  } catch (error: any) {
    console.error("خطأ في deleteBusiness:", error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: "العمل غير موجود"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف العمل"
    });
  }
};

/* ============================
   CHECK IF USER HAS BUSINESS
============================ */
export const checkUserBusiness = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true
      }
    });

    res.json({
      ok: true,
      hasBusiness: !!business,
      data: business
    });
  } catch (err: any) {
    res.status(500).json({ 
      ok: false,
      message: "حدث خطأ في التحقق",
      error: err.message 
    });
  }
};