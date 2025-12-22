// src/controllers/admin/categoryController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 1. إنشاء تصنيف جديد
export const createCategory = async (req, res) => {
  try {
    const { name, description, parentId, imageUrl } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "اسم التصنيف مطلوب"
      });
    }

    // توليد slug من الاسم
    const generateSlug = (text) =>
      text
        .toString()
        .normalize("NFKD")
        .replace(/[^\w\s-\u0600-\u06FF]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();

    let slug = generateSlug(name);

    // تحقق من أن slug فريد
    const existingCategory = await prisma.category.findUnique({ 
      where: { slug } 
    });
    
    if (existingCategory) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // إنشاء التصنيف
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        parentId: parentId ? parseInt(parentId) : null,
        imageUrl: imageUrl || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "تم إنشاء التصنيف بنجاح",
      data: category,
    });

  } catch (error) {
    console.error("خطأ في createCategory:", error);
    
    let errorMessage = "حدث خطأ أثناء إنشاء التصنيف";
    if (error.code === "P2002") errorMessage = "اسم التصنيف مستخدم بالفعل";
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 2. جلب جميع التصنيفات
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { parentId: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        _count: {
          select: {
            businesses: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("خطأ في getCategories:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب التصنيفات",
    });
  }
};

// 3. جلب تصنيف واحد
export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        children: true,
        businesses: {
          take: 10,
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "التصنيف غير موجود"
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("خطأ في getCategory:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب التصنيف",
    });
  }
};

// 4. تحديث تصنيف
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, imageUrl, isActive, sortOrder } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "التصنيف غير موجود"
      });
    }

    // إذا تغير الاسم، عدل الـ slug
    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      const generateSlug = (text) =>
        text
          .toString()
          .normalize("NFKD")
          .replace(/[^\w\s-\u0600-\u06FF]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
      
      slug = generateSlug(name);
      
      // تحقق من أن slug فريد
      const existingSlug = await prisma.category.findFirst({
        where: { 
          slug,
          id: { not: parseInt(id) }
        }
      });
      
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingCategory.name,
        slug,
        description: description !== undefined ? description : existingCategory.description,
        parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : existingCategory.parentId,
        imageUrl: imageUrl !== undefined ? imageUrl : existingCategory.imageUrl,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existingCategory.sortOrder,
      },
    });

    res.status(200).json({
      success: true,
      message: "تم تحديث التصنيف بنجاح",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("خطأ في updateCategory:", error);
    
    let errorMessage = "حدث خطأ أثناء تحديث التصنيف";
    if (error.code === "P2002") errorMessage = "اسم التصنيف مستخدم بالفعل";
    
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// 5. حذف تصنيف
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // تحقق إذا كان التصنيف يحتوي على تصنيفات فرعية
    const hasChildren = await prisma.category.findFirst({
      where: { parentId: parseInt(id) }
    });

    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: "لا يمكن حذف التصنيف لأنه يحتوي على تصنيفات فرعية"
      });
    }

    // تحقق إذا كان التصنيف يحتوي على أعمال
    const hasBusinesses = await prisma.business.findFirst({
      where: { categoryId: parseInt(id) }
    });

    if (hasBusinesses) {
      return res.status(400).json({
        success: false,
        message: "لا يمكن حذف التصنيف لأنه مرتبط بأعمال تجارية"
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: "تم حذف التصنيف بنجاح",
    });
  } catch (error) {
    console.error("خطأ في deleteCategory:", error);
    
    let errorMessage = "حدث خطأ أثناء حذف التصنيف";
    if (error.code === "P2025") errorMessage = "التصنيف غير موجود";
    
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};
