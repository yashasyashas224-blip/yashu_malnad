import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileJson,
  RotateCcw,
  Save,
  ShieldAlert,
} from 'lucide-react';
import {
  DATASET_RULES,
  DATASET_SECTIONS,
  SECTION_BY_ID,
  datasetCounts,
  exportSectionValue,
  loadDraft,
  saveDraft,
  validateSectionJson,
  type SectionId,
  type SectionValidation,
} from '../lib/datasetEditor';
import { Modal } from './Modal';

interface MaintainerSheetProps {
  open: boolean;
  onClose: () => void;
}

export function MaintainerSheet({ open, onClose }: MaintainerSheetProps) {
  const [sectionId, setSectionId] = useState<SectionId>('places');
  const [text, setText] = useState('');
  const [validation, setValidation] = useState<SectionValidation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const section = SECTION_BY_ID.get(sectionId);

  useEffect(() => {
    if (!open) return;
    const draft = loadDraft(sectionId);
    setText(draft ?? exportSectionValue(sectionId));
    setValidation(null);
    setNotice(draft ? 'Loaded the draft saved on this device.' : null);
  }, [open, sectionId]);

  const validate = (): void => {
    const result = validateSectionJson(sectionId, text);
    setValidation(result);
    setNotice(
      result.ok
        ? `Valid: ${result.count} record${result.count === 1 ? '' : 's'}. Nothing has been published.`
        : 'Fix the listed problems before using this section.',
    );
  };

  const save = (): void => {
    const result = saveDraft(sectionId, text);
    setNotice(
      result.ok
        ? 'Draft saved in this browser. Commit the data file and redeploy to publish it.'
        : result.error,
    );
  };

  const reset = (): void => {
    setText(exportSectionValue(sectionId));
    setValidation(null);
    setNotice('Showing the data currently shipped in this build.');
  };

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Copied the JSON to the clipboard.');
    } catch {
      setNotice(
        'This browser blocked clipboard access. Select the text in the box and copy it manually.',
      );
    }
  };

  const download = (): void => {
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `mce-${sectionId}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice(`Downloaded mce-${sectionId}.json.`);
    } catch {
      setNotice('The browser could not create the download. Copy the JSON instead.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Data maintainer (draft tool)"
      description="Validate campus data before you commit it. This tool cannot publish anything."
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <p className="flex items-start gap-2 text-[11px] font-bold leading-relaxed text-red-900">
            <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              There is no sign-in here and no write API. This is not an administration area: anyone
              who opens it can only edit text stored in their own browser. Real protected edits need
              the hosted Express backend’s token authentication and <code>requireAdmin</code>{' '}
              routes, a database that is safe for concurrent writes, and HTTPS — none of which are
              deployed for this static site.
            </span>
          </p>
        </div>

        <h3 className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          What is shipped today
        </h3>
        <ul className="mt-1.5 grid grid-cols-2 gap-1.5">
          {datasetCounts().map((item) => (
            <li
              key={item.label}
              className="flex items-baseline justify-between rounded-lg border border-slate-200 bg-white px-2 py-1.5"
            >
              <span className="text-[10px] font-semibold text-slate-600">{item.label}</span>
              <span className="text-xs font-extrabold text-navy-900">{item.count}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          Section
        </h3>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {DATASET_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={sectionId === item.id}
              onClick={() => setSectionId(item.id)}
              className={`min-h-[32px] rounded-full border px-2.5 text-[10px] font-bold transition ${
                sectionId === item.id
                  ? 'border-navy-900 bg-navy-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {section ? (
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
            {section.description}{' '}
            <span className="font-semibold text-slate-700">Edit {section.file}.</span>
          </p>
        ) : null}

        <label className="mt-3 block">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            JSON for this section
          </span>
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setValidation(null);
            }}
            rows={14}
            spellCheck={false}
            aria-describedby="maintainer-json-hint"
            className="nice-scroll mt-1 w-full rounded-xl border border-slate-300 bg-slate-950 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-100 outline-none"
          />
          <span id="maintainer-json-hint" className="mt-1 block text-[10px] text-slate-500">
            Drafts live in this browser only. Nothing here changes the live site.
          </span>
        </label>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={validate}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-navy-900 px-3 text-[11px] font-bold text-white hover:bg-navy-800"
          >
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            Validate
          </button>
          <button
            type="button"
            onClick={save}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
          >
            <Save aria-hidden="true" className="h-3.5 w-3.5" />
            Save draft
          </button>
          <button
            type="button"
            onClick={() => {
              void copy();
            }}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
          >
            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
            Copy JSON
          </button>
          <button
            type="button"
            onClick={download}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
          >
            <Download aria-hidden="true" className="h-3.5 w-3.5" />
            Download
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Reset to shipped data
          </button>
        </div>

        <p role="status" aria-live="polite" className="mt-2 min-h-[1rem] text-[11px] font-semibold text-slate-600">
          {notice ?? ''}
        </p>

        {validation ? (
          validation.ok ? (
            <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-900">
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                All checks passed for {validation.count} record
                {validation.count === 1 ? '' : 's'}
              </p>
              {validation.warnings.length > 0 ? (
                <ul className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-emerald-900">
                  {validation.warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-red-900">
                <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
                {validation.errors.length} problem
                {validation.errors.length === 1 ? '' : 's'} found
              </p>
              <ul role="alert" className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-[11px] leading-relaxed text-red-900">
                {validation.errors.map((error) => (
                  <li key={error}>• {error}</li>
                ))}
              </ul>
            </div>
          )
        ) : null}

        <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <h3 className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            <Database aria-hidden="true" className="h-3.5 w-3.5" />
            What every section must satisfy
          </h3>
          <ul className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-slate-600">
            {DATASET_RULES.map((rule) => (
              <li key={rule}>• {rule}</li>
            ))}
          </ul>
        </section>

        <p className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] leading-relaxed text-slate-500">
          <FileJson aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            To publish: validate here, copy the JSON into the named data file, run{' '}
            <code className="rounded bg-slate-200 px-1">npm run typecheck</code>,{' '}
            <code className="rounded bg-slate-200 px-1">npm run build</code> and deploy. The app
            never writes to the data files itself.
          </span>
        </p>
      </div>
    </Modal>
  );
}
