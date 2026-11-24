import { useMemo, useState } from 'react';
import { Accessibility, Layers, MapPin } from 'lucide-react';
import {
  ACCESSIBILITY_FEATURES,
  ACCESSIBILITY_KINDS,
  accessibilityCheckedOn,
  type AccessibilityFeatureKind,
} from '../data/accessibility';
import { LOCATION_BY_ID, type CampusLocation } from '../data/locations';
import { useI18n } from '../lib/i18n';
import { formatCheckedDate } from '../data/facilities';
import { Modal } from './Modal';

interface AccessibilitySheetProps {
  open: boolean;
  onClose: () => void;
  showOnMap: boolean;
  onToggleMap: () => void;
  onOpenLocation: (location: CampusLocation) => void;
}

export function AccessibilitySheet({
  open,
  onClose,
  showOnMap,
  onToggleMap,
  onOpenLocation,
}: AccessibilitySheetProps) {
  const { t } = useI18n();
  const [kind, setKind] = useState<AccessibilityFeatureKind | 'all'>('all');

  const features = useMemo(
    () =>
      ACCESSIBILITY_FEATURES.filter((feature) => kind === 'all' || feature.kind === kind),
    [kind],
  );

  const surveyedOn = accessibilityCheckedOn();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('a11y.title')}
      description={t('a11y.description')}
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        <div
          role="group"
          aria-label={t('a11y.filterLabel')}
          className="flex flex-wrap gap-1.5"
        >
          <button
            type="button"
            aria-pressed={kind === 'all'}
            onClick={() => setKind('all')}
            className={`min-h-[34px] rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
              kind === 'all'
                ? 'border-navy-900 bg-navy-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t('a11y.all')}
          </button>
          {ACCESSIBILITY_KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={kind === item.id}
              onClick={() => setKind(item.id)}
              className={`min-h-[34px] rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                kind === item.id
                  ? 'border-navy-900 bg-navy-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span aria-hidden="true">{item.emoji}</span> {item.shortLabel}
            </button>
          ))}
        </div>

        {ACCESSIBILITY_FEATURES.length > 0 ? (
          <button
            type="button"
            onClick={onToggleMap}
            aria-pressed={showOnMap}
            className="mt-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
          >
            <Layers aria-hidden="true" className="h-3.5 w-3.5" />
            {showOnMap ? t('a11y.hideFromMap') : t('a11y.showOnMap')}
          </button>
        ) : null}

        {ACCESSIBILITY_FEATURES.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
            <Accessibility aria-hidden="true" className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-navy-900">{t('a11y.emptyTitle')}</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              {t('a11y.emptyBody')}
            </p>
            <p className="mx-auto mt-2 max-w-md rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600">
              {t('a11y.emptyAddHint')}
            </p>
          </div>
        ) : features.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">
            {t('a11y.noneInFilter')}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {features.map((feature) => {
              const location = feature.locationId
                ? LOCATION_BY_ID.get(feature.locationId)
                : undefined;
              return (
                <li
                  key={feature.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <p className="text-sm font-bold text-navy-900">{feature.label}</p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {feature.kind.replace('-', ' ')}
                  </p>
                  {feature.note ? (
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{feature.note}</p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-semibold text-slate-500">
                      {t('a11y.surveyedOn', { date: formatCheckedDate(feature.checkedOn) })}
                    </span>
                    {location ? (
                      <button
                        type="button"
                        onClick={() => onOpenLocation(location)}
                        className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                      >
                        <MapPin aria-hidden="true" className="h-3 w-3" />
                        {t('a11y.openPlace')}: {location.name}
                      </button>
                    ) : null}
                    {feature.source ? (
                      <a
                        href={feature.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        {feature.source.label}
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {surveyedOn ? (
          <p className="mt-3 text-[11px] text-slate-500">
            {t('a11y.surveyedOn', { date: formatCheckedDate(surveyedOn) })}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
