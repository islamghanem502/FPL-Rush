import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // إعداد الروابط بناءً على حالة المستخدم
  let navLinks = [];

  if (isAdmin) {
    navLinks = [{ name: "لوحة التحكم", path: "/admin" }];
  } else {
    navLinks = [{ name: "الرئيسية", path: user ? "/dashboard" : "/" }];

    // تمت إزالة شرط صفحة "تاريخي" من هنا
    if (user) {
      navLinks.push({ name: "الملف الشخصي", path: "/profile" });
    } else {
      navLinks.push({ name: "الشركاء", path: "/partnership" });
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-3xl font-black italic tracking-tighter"
            >
              FPL <span className="text-[#22c55e]">RUSH</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8 space-x-reverse">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-bold transition-all hover:text-[#22c55e] ${location.pathname === link.path
                    ? "text-[#22c55e]"
                    : "text-gray-300"
                  }`}
              >
                {link.name}
              </Link>
            ))}

            {user || isAdmin ? (
              <div className="flex items-center gap-3">
                {user && (
                  <Link to="/profile" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#22c55e]/50 group-hover:border-[#22c55e] transition-all bg-slate-800 flex items-center justify-center text-xs font-bold text-white shadow-md">
                      {user.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.managerName ? user.managerName.charAt(0).toUpperCase() : '👤'}</span>
                      )}
                    </div>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-all"
                >
                  خروج
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-[#22c55e] text-slate-900 px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-green-500/20"
              >
                دخول
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 focus:outline-none p-2"
            >
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 animate-in slide-in-from-top duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-4 text-base font-bold text-gray-300 border-b border-slate-800 hover:bg-slate-800"
              >
                {link.name}
              </Link>
            ))}

            {user || isAdmin ? (
              <button
                onClick={handleLogout}
                className="block w-full text-right px-3 py-4 text-base font-bold text-red-400"
              >
                خروج
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-4 text-base font-bold text-[#22c55e]"
              >
                دخول
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;