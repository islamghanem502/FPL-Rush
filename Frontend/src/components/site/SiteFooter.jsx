import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/useAuth';
import { Wordmark } from './Wordmark';

const EMAIL = 'fplrush.official@gmail.com';

const LINKS = [
  ['/', 'الرئيسية'],
  ['/bonus', 'بونص اللاعبين'],
  ['/partnership', 'عقد الشراكات'],
];

// Signed-in phones still have the fixed tab bar at the bottom — leave room.
export function SiteFooter() {
  const { data: me } = useMe();
  return (
    <footer className={cn('mt-16 rounded-t-[32px] border-2 border-b-0 border-edge bg-night-2 px-4 pt-8 md:px-8 md:pb-10', me ? 'pb-28' : 'pb-10')}>
      <div className="mx-auto max-w-[1120px]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Wordmark />
            <p className="mt-3 max-w-[340px] text-[14px] leading-relaxed text-white/60">
              المنصة العربية لتحديات الفانتازي المخصصة — تحديات تبدأ وتنتهي في جولات محددة، وترتيب مباشر.
            </p>
          </div>
          <nav aria-label="روابط سريعة">
            <div className="font-display text-[12px] font-semibold text-white/45">روابط سريعة</div>
            <div className="mt-3 flex flex-col gap-2.5 text-[14.5px] font-medium">
              {LINKS.map(([to, label]) => (
                <Link key={to} to={to} className="w-fit transition-colors hover:text-pitch">{label}</Link>
              ))}
            </div>
          </nav>
          <div>
            <div className="font-display text-[12px] font-semibold text-white/45">تواصل معنا</div>
            <a href={`mailto:${EMAIL}`} dir="ltr" className="mt-3 block max-w-full truncate text-[13px] font-medium transition-colors hover:text-pitch md:w-fit md:text-[14px]">
              {EMAIL}
            </a>
          </div>
        </div>
        <div className="my-6 h-0.5 rounded-full bg-edge" />
        <p dir="ltr" className="text-center font-display text-[11px] leading-relaxed tracking-[.08em] text-white/40">
          © {new Date().getFullYear()} FPL RUSH · INDEPENDENT PLATFORM · NOT AFFILIATED WITH THE PREMIER LEAGUE
        </p>
      </div>
    </footer>
  );
}
