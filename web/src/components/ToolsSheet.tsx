import {
  Accessibility,
  CalendarDays,
  DoorOpen,
  Footprints,
  Languages,
} from 'lucide-react';
import { useI18n, type Language } from '../lib/i18n';
import { Modal } from './Modal';

interface ToolsSheetProps {
  open: boolean;
  onClose: () => void;
  onRoutes: () => void;
  onClassrooms: () => void;
  onEvents: () => void;
  onAccessibility: () => void;
}

export function ToolsSheet({
  open,
  onClose,
  onRoutes,
  onClassrooms,
  onEvents,
  onAccessibility,
}: ToolsSheetProps) {
  const { t, language, setLanguage } = useI18n();

  const tiles = [
    { label: t('more.routes'), icon: Footprints, onClick: onRoutes },
    { label: t('more.classrooms'), icon: DoorOpen, onClick: onClassrooms },
    { label: t('more.events'), icon: CalendarDays, onClick: onEvents },
    { label: t('more.accessibility'), icon: Accessibility, onClick: onAccessibility },
  ];

  const languages: Array<{ id: Language; label: string }> = [
    { id: 'en', label: 'English' },
    { id: 'kn', label: 'ಕನ್ನಡ' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('more.title')}
      description={t('more.description')}
      variant="sheet"
    >
      <div className="nice-scroll overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          {tiles.map((tile) => (
            <button
              key={tile.label}
              type="button"
              onClick={() => {
                onClose();
                tile.onClick();
              }}
              className="flex min-h-[76px] flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-xl bg-navy-900 text-white"
              >
                <tile.icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-extrabold text-navy-900">{tile.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            <Languages aria-hidden="true" className="h-3.5 w-3.5" />
            {t('more.language')}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">{t('more.languageHint')}</p>
          <div className="mt-2 flex gap-1.5">
            {languages.map((item) => (
              <button
                key={item.id}
                type="button"
                lang={item.id}
                aria-pressed={language === item.id}
                onClick={() => setLanguage(item.id)}
                className={`min-h-[38px] flex-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  language === item.id
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
