

import toast from "react-hot-toast";
import axios from "axios";

const axiosToastError = (error: unknown) => {
  // Axios Error
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    // رسالة من السيرفر
    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "حدث خطأ غير متوقع";

    // 400 أخطاء مدخلات
    if (status === 400) return toast.error(msg);

    // 401 توكن غير صالح
    if (status === 401) return toast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول.");

    // 403 ممنوع
    if (status === 403) return toast.error("ليس لديك صلاحية للقيام بهذا الإجراء.");

    // 404 غير موجود
    if (status === 404) return toast.error("العنصر المطلوب غير موجود.");

    // 500 سيرفر
    if (status === 500) return toast.error("خطأ في السيرفر، حاول لاحقًا.");

    // جميع الأخطاء الأخرى
    return toast.error(msg);
  }

  // Network errors (لا يوجد انترنت)
  if (error instanceof Error) {
    return toast.error(error.message);
  }

  // Unknown
  return toast.error("حدث خطأ غير متوقع.");
};

export default axiosToastError;
