import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/useAuth';
import { Wordmark } from './Chrome';

const EMAIL = 'fplrush.official@gmail.com';

// Used on public screens only (landing, partnership, profile). App screens
// end at the tab bar — no footer noise.
export function Footer() {
  const { data: me } = useMe();
  return (
    <footer className={cn('mt-8 rounded-t-chrome bg-ink px-5 pt-6 text-canvas md:pb-8', me ? 'pb-28' : 'pb-8')}>
      <div className="mx-auto max-w-[600px]">
        <Wordmark />
        <p className="mt-2.5 text-[13px] font-semibold leading-relaxed opacity-70">
          المنصة العربية لتحديات الفانتازي المخصصة — تحديات تبدأ وتنتهي في جولات محددة، وترتيب مباشر.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-5">
          <div>
            <div className="text-[12px] font-black text-brand">روابط سريعة</div>
            <div className="mt-2.5 flex flex-col gap-2 text-[13px] font-semibold">
              <Link to="/">الرئيسية</Link>
              <Link to="/bonus">بونص اللاعبين</Link>
              <Link to="/partnership">عقد الشراكات</Link>
            </div>
          </div>
          <div>
            <div className="text-[12px] font-black text-brand">تواصل معنا</div>
            <a href={`mailto:${EMAIL}`} className="mono mt-2.5 block truncate text-[11.5px]">{EMAIL}</a>
          </div>
        </div>
        <div className="my-4 h-px bg-canvas/20" />
        <p className="mono text-center text-[9.5px] leading-relaxed tracking-[.06em] opacity-60">
          © {new Date().getFullYear()} FPL RUSH · INDEPENDENT PLATFORM
          <br />
          NOT AFFILIATED WITH THE PREMIER LEAGUE
        </p>
      </div>
    </footer>
  );
}
