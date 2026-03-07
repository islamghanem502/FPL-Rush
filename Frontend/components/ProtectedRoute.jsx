import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // 1️⃣ حالة التحميل: بنظهر Spinner أو رسالة بسيطة لحد ما نتأكد من حالة التوكن
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-cyan-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500"></div>
      </div>
    );
  }

  // 2️⃣ حماية عامة: لو مفيش مستخدم مسجل دخول أصلاً
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3️⃣ حماية الأدمن: لو الصفحة مخصصة للأدمن فقط والمستخدم عادي
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4️⃣ حماية التوثيق (Logic الجديد):
  // لو المستخدم مسجل دخول بس لسه مش Verified (isVerified: false)
  // والصفحة اللي بيحاول يدخلها مش صفحة التحقق نفسها
  if (!user.isVerified && location.pathname !== "/verify") {
    return <Navigate to="/verify" replace />;
  }

  // 5️⃣ منع التكرار: لو المستخدم Verified فعلاً وبيحاول يدخل صفحة /verify يدوياً
  if (user.isVerified && location.pathname === "/verify") {
    return <Navigate to="/dashboard" replace />;
  }

  // 6️⃣ العبور الآمن: لو كل الشروط تمام
  return children;
};

export default ProtectedRoute;
