import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Eye,
  EyeOff,
  Flag,
  HardDrive,
  MapPin,
  Radio,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { LOCATION_BY_ID, type CampusLocation } from '../data/locations';
import {
  PULSE_DEVICE_NOTICE,
  REPORT_KINDS,
  REPORT_POLICY,
  type PulseReport,
  type ReportKind,
} from '../data/reports';
import {
  activeReports,
  clearReports,
  deleteReport,
  loadReports,
  reportStatus,
  setReportHidden,
  setReportVerification,
  submitReport,
  timeAgo,
} from '../lib/pulse';
import { Modal } from './Modal';

interface PulseSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenLocation: (location: CampusLocation) => void;
}

const KIND_BY_ID = new Map(REPORT_KINDS.map((kind) => [kind.id, kind] as const));

const kindLabel = (kind: ReportKind): string => KIND_BY_ID.get(kind)?.label ?? 'Report';

export function PulseSheet({ open, onClose, onOpenLocation }: PulseSheetProps) {
  const [reports, setReports] = useState<PulseReport[]>(() => loadReports());
  const [kind, setKind] = useState<ReportKind>('queue');
  const [locationId, setLocationId] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [moderationOpen, setModerationOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReports(loadReports());
    setErrors([]);
    setNotice(null);
    setModerationOpen(false);
  }, [open]);

  const active = activeReports(reports);
  const hiddenCount = reports.filter((report) => report.hidden).length;

  const submit = (): void => {
    const result = submitReport(
      { kind, locationId: locationId || null, message },
      reports,
    );
    if (!result.ok) {
      setErrors(result.errors);
      setNotice(null);
      return;
    }
    setReports(result.reports);
    setMessage('');
    setErrors([]);
    setNotice('Saved on this device only. Nobody else can see it.');
  };

  const applyChange = (outcome: {
    reports: PulseReport[];
    result: { ok: boolean; error?: string };
  }): void => {
    setReports(outcome.reports);
    setNotice(outcome.result.ok ? null : (outcome.result.error ?? 'Could not save that change.'));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Campus Pulse"
      description="Short, time-stamped notes about what is happening on campus right now."
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-amber-900">
          <HardDrive aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{PULSE_DEVICE_NOTICE}</span>
        </p>

        <h3 className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          Post a report
        </h3>

        <form
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">What is happening</span>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as ReportKind)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-navy-900"
              >
                {REPORT_KINDS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Where</span>
              <select
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-navy-900"
              >
                <option value="">Campus-wide (no specific place)</option>
                {Array.from(LOCATION_BY_ID.values()).map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] font-bold text-slate-600">Short note</span>
            <textarea
              value={message}
              rows={3}
              maxLength={REPORT_POLICY.maxLength}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="e.g. Main gate queue is past the bus stop right now"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-navy-900 placeholder:text-slate-400"
            />
            <span className="mt-0.5 flex justify-between text-[10px] text-slate-500">
              <span>
                At least {REPORT_POLICY.minLength} characters; links are rejected.
              </span>
              <span>
                {message.length}/{REPORT_POLICY.maxLength}
              </span>
            </span>
          </label>

          {errors.length > 0 ? (
            <ul role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-800">
              {errors.map((error) => (
                <li key={error} className="flex items-start gap-1.5">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
                  {error}
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="submit"
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-navy-900 px-4 text-sm font-bold text-white transition hover:bg-navy-800"
          >
            <Radio aria-hidden="true" className="h-4 w-4" />
            Save report on this device
          </button>
        </form>

        <p role="status" aria-live="polite" className="mt-2 min-h-[1rem] text-[11px] font-semibold text-slate-600">
          {notice ?? ''}
        </p>

        <h3 className="mt-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          Recent reports on this device ({active.length})
        </h3>

        {active.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
            <Radio aria-hidden="true" className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-navy-900">Nothing reported on this device</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              Reports you save here appear only in this browser. A shared campus feed needs the
              hosted backend and moderator accounts described in the project’s report data file.
            </p>
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {active.map((report) => {
              const place = report.locationId ? LOCATION_BY_ID.get(report.locationId) : undefined;
              const status = reportStatus(report);
              return (
                <li key={report.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-extrabold text-navy-900">
                      {kindLabel(report.kind)}
                    </p>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-500">
                      {timeAgo(report.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                    <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
                    {place?.name ?? 'Campus-wide'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700">{report.message}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                        report.verification === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-900'
                          : report.verification === 'flagged'
                            ? 'bg-red-100 text-red-900'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {report.verification}
                    </span>
                    {status === 'stale' ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
                        Stale — older than 6 hours
                      </span>
                    ) : null}
                    {place ? (
                      <button
                        type="button"
                        onClick={() => onOpenLocation(place)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
                      >
                        Open place
                        <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <h3 className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Moderation
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
            There is no sign-in and no moderator account in this build, so these controls are not
            real moderation: they hide or delete reports from this browser only. Production
            moderation needs authenticated <code className="rounded bg-slate-200 px-1">requireAdmin</code>{' '}
            endpoints on the hosted backend, as described in{' '}
            <code className="rounded bg-slate-200 px-1">src/data/reports.ts</code>.
          </p>
          <button
            type="button"
            aria-expanded={moderationOpen}
            onClick={() => setModerationOpen((value) => !value)}
            className="mt-2 inline-flex min-h-[36px] items-center rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-navy-900 hover:bg-slate-100"
          >
            {moderationOpen ? 'Hide device tools' : 'Show device-only moderation tools'}
          </button>

          {moderationOpen ? (
            <div className="mt-2">
              <p className="text-[10px] text-slate-500">
                {reports.length} stored report{reports.length === 1 ? '' : 's'}
                {hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ''}. Expired reports are kept until
                cleared.
              </p>
              {reports.length === 0 ? (
                <p className="mt-1 text-[11px] text-slate-500">Nothing stored on this device.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {reports.map((report) => (
                    <li
                      key={report.id}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-2"
                    >
                      <p className="text-[11px] font-bold text-navy-900">
                        {kindLabel(report.kind)} · {timeAgo(report.createdAt)}
                        {report.hidden ? ' · hidden' : ''}
                        {reportStatus(report) === 'expired' ? ' · expired' : ''}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-600">
                        {report.message}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            applyChange(setReportHidden(reports, report.id, !report.hidden))
                          }
                          className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-slate-300 px-2 text-[10px] font-bold text-navy-900 hover:bg-slate-50"
                        >
                          {report.hidden ? (
                            <Eye aria-hidden="true" className="h-3 w-3" />
                          ) : (
                            <EyeOff aria-hidden="true" className="h-3 w-3" />
                          )}
                          {report.hidden ? 'Unhide' : 'Hide'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReports(
                              setReportVerification(
                                reports,
                                report.id,
                                report.verification === 'confirmed' ? 'unverified' : 'confirmed',
                              ).reports,
                            )
                          }
                          className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-slate-300 px-2 text-[10px] font-bold text-emerald-800 hover:bg-emerald-50"
                        >
                          <ShieldCheck aria-hidden="true" className="h-3 w-3" />
                          {report.verification === 'confirmed' ? 'Unconfirm' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReports(
                              setReportVerification(
                                reports,
                                report.id,
                                report.verification === 'flagged' ? 'unverified' : 'flagged',
                              ).reports,
                            )
                          }
                          className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-slate-300 px-2 text-[10px] font-bold text-amber-800 hover:bg-amber-50"
                        >
                          <Flag aria-hidden="true" className="h-3 w-3" />
                          {report.verification === 'flagged' ? 'Unflag' : 'Flag'}
                        </button>
                        <button
                          type="button"
                          onClick={() => applyChange(deleteReport(reports, report.id))}
                          className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-red-200 px-2 text-[10px] font-bold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 aria-hidden="true" className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => {
                  const result = clearReports();
                  setReports([]);
                  setNotice(result.ok ? 'All reports cleared on this device.' : result.error);
                }}
                className="mt-2 text-[11px] font-bold text-slate-500 underline-offset-2 hover:underline"
              >
                Clear every report stored on this device
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </Modal>
  );
}
