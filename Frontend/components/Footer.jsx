import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-white/5 pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8 px-3 sm:px-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12 text-right">
          

          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <Link to="/" className="text-2xl sm:text-3xl font-black italic mb-4 sm:mb-6 block text-white tracking-tighter">
              FPL <span className="text-[#22c55e]">RUSH</span>
            </Link>
            <p className="text-gray-400 max-w-sm leading-relaxed font-medium text-xs sm:text-sm">
              المنصة الرائدة لتحديات الفانتازي عالمياً. صُممت لتقديم تجربة تنافسية عادلة تليق بنخبة المدربين .
            </p>
          </div>


          <div className="flex flex-col items-start">
            <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm sm:text-lg">روابط سريعة</h4>
            <ul className="space-y-2 sm:space-y-4 text-gray-500 font-medium text-xs sm:text-sm">
              <li><Link to="/" className="hover:text-[#22c55e] transition-colors">الرئيسية</Link></li>
              <li><Link to="/partnership" className="hover:text-[#22c55e] transition-colors">عقد الشراكات</Link></li>
              <li><Link to="/login" className="hover:text-[#22c55e] transition-colors">بوابة الدخول</Link></li>
            </ul>
          </div>


          <div className="flex flex-col items-start">
            <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm sm:text-lg">تواصل معنا</h4>
            <ul className="space-y-3 sm:space-y-4 text-gray-500 font-medium w-full">

              <li className="flex items-center gap-2 sm:gap-3 justify-start">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#22c55e] flex-shrink-0" />
                <span className="text-xs sm:text-sm tracking-wide break-all">fplrush.official@gmail.com</span>
              </li>


              <li className="flex gap-2 sm:gap-4 mt-4 sm:mt-6 justify-start">
                <a 
                  href="#" 
                  aria-label="Instagram"
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-slate-900 flex items-center justify-center hover:bg-[#22c55e] hover:text-slate-950 transition-all border border-white/5 shadow-lg transform hover:-translate-y-1 flex-shrink-0"
                >
                  <Instagram size={18} className="sm:w-5 sm:h-5" />
                </a>
                <a 
                  href="#" 
                  aria-label="Facebook"
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-slate-900 flex items-center justify-center hover:bg-[#22c55e] hover:text-slate-950 transition-all border border-white/5 shadow-lg transform hover:-translate-y-1 flex-shrink-0"
                >
                  <Facebook size={18} className="sm:w-5 sm:h-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 border-t border-white/5 text-center px-2 sm:px-4">
          <p className="text-gray-600 text-[10px] sm:text-xs mb-1 sm:mb-2 leading-relaxed sm:leading-loose max-w-3xl mx-auto italic">
            &copy; {new Date().getFullYear()} **FPL Rush**. جميع الحقوق محفوظة. 
            تحديات مبنية على المهارة ومكافآت للنخبة.
          </p>
          <p className="text-gray-700 text-[9px] sm:text-[10px] uppercase tracking-widest">
            Independent Platform • Not Affiliated with the Premier League
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;