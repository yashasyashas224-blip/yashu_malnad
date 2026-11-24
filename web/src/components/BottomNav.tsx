import { Map, MessageCircle, MoreHorizontal, PhoneCall, ScanLine } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface BottomNavProps {
  onExplore: () => void;
  onAssistant: () => void;
  onScan: () => void;
  onMore: () => void;
}

export function BottomNav({ onExplore, onAssistant, onScan, onMore }: BottomNavProps) {
  const { t } = useI18n();
  const itemClass =
    'flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-bold text-slate-300 transition hover:bg-white/10 hover:text-white';

  return (
    <nav
      aria-label={t('nav.label')}
      className="shrink-0 bg-navy-900 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        <button type="button" onClick={onExplore} className={itemClass}>
          <Map aria-hidden="true" className="h-5 w-5" />
          {t('nav.explore')}
        </button>
        <button type="button" onClick={onAssistant} className={itemClass}>
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
          {t('nav.assistant')}
        </button>
        <button type="button" onClick={onScan} className={itemClass}>
          <ScanLine aria-hidden="true" className="h-5 w-5" />
          {t('nav.scan')}
        </button>
        <button type="button" onClick={onMore} className={itemClass}>
          <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
          {t('nav.more')}
        </button>
        <a
          href="tel:9449689093"
          aria-label="Call campus emergency: Dean of Student Affairs, 94496 89093"
          className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-bold text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
        >
          <PhoneCall aria-hidden="true" className="h-5 w-5" />
          {t('nav.sos')}
        </a>
      </div>
    </nav>
  );
}
