import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalVariant = 'center' | 'drawer' | 'sheet';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: ModalVariant;
  children: ReactNode;
}

const VARIANT_CLASS: Record<ModalVariant, string> = {
  center: 'modal--center',
  drawer: 'modal--drawer',
  sheet: 'modal--sheet',
};

const PANEL_CLASS: Record<ModalVariant, string> = {
  center:
    'flex max-h-[90dvh] w-[min(92vw,580px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl',
  drawer: 'flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl',
  sheet:
    'flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  variant = 'center',
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId().replace(/:/g, '');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      const dialog = dialogRef.current;
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${VARIANT_CLASS[variant]}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={PANEL_CLASS[variant]}>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-extrabold tracking-tight text-navy-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-navy-900"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
