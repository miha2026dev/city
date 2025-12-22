"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Search, Filter, Layers, 
  ArrowLeft, CheckCircle, XCircle, Eye 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Axios from '../utilts/Axios';
import SummaryApi from '../common/SummaryApi';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  _count?: {
    businesses: number;
  };
}

const AdminCategoriesPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    imageUrl: '',
    sortOrder: 0,
    isActive: true
  });

  // جلب التصنيفات
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response=await Axios({
        ...SummaryApi.category.get_categories
      })
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('خطأ في جلب التصنيفات:', error);
      toast.error('فشل في جلب التصنيفات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // إنشاء تصنيف جديد
  const handleCreateCategory = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.category.create_category,
        data: formData
      });

      if (response.data.success) {
        toast.success('تم إنشاء التصنيف بنجاح');
        setShowAddModal(false);
        setFormData({
          name: '',
          description: '',
          parentId: '',
          imageUrl: '',
          sortOrder: 0,
          isActive: true
        });
        fetchCategories();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في إنشاء التصنيف');
    }
  };

  // تحديث تصنيف
  const handleUpdateCategory = async () => {
    if (!currentCategory) return;
    
    try {
      const response = await Axios({
        ...SummaryApi.category.updateCategory(currentCategory.id),
        data: formData
      });

      if (response.data.success) {
        toast.success('تم تحديث التصنيف بنجاح');
        setShowEditModal(false);
        fetchCategories();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في تحديث التصنيف');
    }
  };

  // حذف تصنيف
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

    try {
      const response = await Axios(SummaryApi.category.deleteCategory(id));
      
      if (response.data.success) {
        toast.success('تم حذف التصنيف بنجاح');
        fetchCategories();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في حذف التصنيف');
    }
  };

  // حذف متعدد
  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;
    
    if (!confirm(`هل أنت متأكد من حذف ${selectedCategories.length} تصنيف؟`)) return;

    try {
      const deletePromises = selectedCategories.map(id =>
        Axios(SummaryApi.category.deleteCategory(id))
      );
      
      await Promise.all(deletePromises);
      toast.success(`تم حذف ${selectedCategories.length} تصنيف بنجاح`);
      setSelectedCategories([]);
      fetchCategories();
    } catch (error) {
      toast.error('فشل في حذف التصنيفات');
    }
  };

  // تصفية التصنيفات
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase()) ||
    category.description?.toLowerCase().includes(search.toLowerCase()) ||
    category.slug.toLowerCase().includes(search.toLowerCase())
  );

  // فتح نموذج التعديل
  const openEditModal = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId?.toString() || '',
      imageUrl: category.imageUrl || '',
      sortOrder: category.sortOrder,
      isActive: category.isActive
    });
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/AdminController')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-purple-700 bg-clip-text text-transparent">
                  إدارة التصنيفات
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  قم بإدارة وتنظيم تصنيفات الأعمال في النظام
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                إضافة تصنيف جديد
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { label: 'إجمالي التصنيفات', value: categories.length, color: 'purple' },
            { label: 'التصنيفات الرئيسية', value: categories.filter(c => !c.parentId).length, color: 'blue' },
            { label: 'التصنيفات الفرعية', value: categories.filter(c => c.parentId).length, color: 'green' },
            { label: 'التصنيفات النشطة', value: categories.filter(c => c.isActive).length, color: 'emerald' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                  <Layers className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                placeholder="ابحث باسم التصنيف أو الوصف..."
                className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-3">
              {selectedCategories.length > 0 && (
                <>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>حذف المحدد ({selectedCategories.length})</span>
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategories([])}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300"
                  >
                    إلغاء التحديد
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Categories Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري تحميل التصنيفات...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-right">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories(filteredCategories.map(c => c.id));
                          } else {
                            setSelectedCategories([]);
                          }
                        }}
                        checked={
                          selectedCategories.length === filteredCategories.length &&
                          filteredCategories.length > 0
                        }
                        className="w-4 h-4 text-purple-500 rounded focus:ring-purple-400"
                      />
                    </th>
                    <th className="p-4 text-right text-gray-700 font-semibold">الاسم</th>
                    <th className="p-4 text-right text-gray-700 font-semibold">الرابط</th>
                    <th className="p-4 text-right text-gray-700 font-semibold">الوصف</th>
                    <th className="p-4 text-right text-gray-700 font-semibold">الأعمال</th>
                    <th className="p-4 text-right text-gray-700 font-semibold">الحالة</th>
                    <th className="p-4 text-right text-gray-700 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <motion.tr
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-all duration-300"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories(prev => [...prev, category.id]);
                            } else {
                              setSelectedCategories(prev => prev.filter(id => id !== category.id));
                            }
                          }}
                          className="w-4 h-4 text-purple-500 rounded focus:ring-purple-400"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {category.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{category.name}</p>
                            {category.parentId && (
                              <p className="text-xs text-gray-500">تصنيف فرعي</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                          /{category.slug}
                        </code>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-600 max-w-xs truncate">
                          {category.description || 'لا يوجد وصف'}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {category._count?.businesses || 0} عمل
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.isActive ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              نشط
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              غير نشط
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openEditModal(category)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredCategories.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد تصنيفات</h3>
              <p className="text-gray-600 mb-6">ابدأ بإضافة أول تصنيف لنظامك</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-300"
              >
                إضافة تصنيف جديد
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      {/* إضافة Modal إضافة التصنيف */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md"
          >
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">إضافة تصنيف جديد</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم التصنيف *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="مثال: مطاعم"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="وصف قصير للتصنيف..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف الأب</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">بدون (تصنيف رئيسي)</option>
                  {categories.filter(c => !c.parentId).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-700">نشط</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateCategory}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                إضافة
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal تعديل التصنيف */}
      {showEditModal && currentCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md"
          >
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">تعديل التصنيف</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* نفس حقول الإضافة */}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdateCategory}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                تحديث
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;