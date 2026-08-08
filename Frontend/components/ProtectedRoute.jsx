import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // 1️⃣ حالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-[#22c55e]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#22c55e]"></div>
      </div>
    );
  }

  // 2️⃣ حماية عامة: لو مفيش مستخدم مسجل دخول أصلاً
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3️⃣ حماية الأدمن
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4️⃣ حماية التوثيق التام: منع دخول الداشبورد والأجزاء المحمية إلا إذا كان الحساب موثقاً بالكامل 100%
  if (!user.isVerified) {
    return <Navigate to="/register" replace />;
  }

  return children;
};

export default ProtectedRoute;
