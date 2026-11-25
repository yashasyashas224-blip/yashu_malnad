import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import {
  Camera,
  CameraOff,
  Loader2,
  RotateCcw,
  Search,
  ShieldAlert,
  VideoOff,
} from 'lucide-react';
import type { CampusLocation } from '../data/locations';
import { INDOOR_QR_HINT } from '../data/indoor';
import { parseIndoorCode, type IndoorCodeTarget } from '../lib/indoor';
import { QR_FORMAT_HINT, resolveCampusQr } from '../lib/qr';
import { Modal } from './Modal';

type ScanStatus =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'denied'
  | 'no-camera'
  | 'in-use'
  | 'error'
  | 'result-error';

interface ScannerDialogProps {
  open: boolean;
  locations: CampusLocation[];
  onClose: () => void;
  onResolved: (location: CampusLocation) => void;
  onSearchInstead: () => void;
  onIndoorCode?: (target: IndoorCodeTarget) => void;
}

function stopStream(video: HTMLVideoElement | null): void {
  if (!video) return;
  const stream = video.srcObject;
  if (stream instanceof MediaStream) {
    for (const track of stream.getTracks()) track.stop();
  }
  video.srcObject = null;
}

function cameraErrorStatus(error: unknown): ScanStatus {
  const name = (error as { name?: string } | null)?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no-camera';
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'in-use';
  return 'error';
}

const ERROR_COPY: Record<
  Exclude<ScanStatus, 'idle' | 'starting' | 'scanning' | 'result-error'>,
  { title: string; body: string }
> = {
  denied: {
    title: 'Camera permission was denied',
    body: 'Allow camera access for this site in your browser settings, then try again. You can always search for the place manually instead.',
  },
  'no-camera': {
    title: 'No camera was found',
    body: 'This device does not have a camera available to the browser. Search for the campus place manually instead.',
  },
  'in-use': {
    title: 'The camera is busy',
    body: 'Another app or browser tab is using the camera. Close it, then try again, or search for the place instead.',
  },
  error: {
    title: 'The camera could not start',
    body: 'The browser could not start video capture. Check your camera and site permissions, then try again, or search manually.',
  },
};

export function ScannerDialog({
  open,
  locations,
  onClose,
  onResolved,
  onSearchInstead,
  onIndoorCode,
}: ScannerDialogProps) {
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [resultMessage, setResultMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const handledRef = useRef(false);
  const locationsRef = useRef(locations);
  const onResolvedRef = useRef(onResolved);
  const onCloseRef = useRef(onClose);
  const onIndoorCodeRef = useRef(onIndoorCode);

  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  useEffect(() => {
    onResolvedRef.current = onResolved;
    onCloseRef.current = onClose;
    onIndoorCodeRef.current = onIndoorCode;
  }, [onClose, onIndoorCode, onResolved]);

  useEffect(() => {
    if (open) return;
    setStarted(false);
    setStatus('idle');
    setResultMessage('');
    handledRef.current = false;
    stopStream(videoRef.current);
  }, [open]);

  useEffect(() => {
    if (!open || !started) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let controls: { stop: () => void } | null = null;
    let timedOut = false;
    handledRef.current = false;
    setStatus('starting');

    const startTimeout = window.setTimeout(() => {
      if (cancelled || controls) return;
      timedOut = true;
      stopStream(video);
      setStatus('error');
    }, 15000);

    const reader = new BrowserQRCodeReader();

    const handleContent = (content: string): void => {
      if (cancelled || handledRef.current) return;
      handledRef.current = true;
      controls?.stop();
      controls = null;
      stopStream(video);

      const indoor = parseIndoorCode(content);
      if (indoor && onIndoorCodeRef.current) {
        onIndoorCodeRef.current(indoor);
        onCloseRef.current();
        return;
      }

      const resolution = resolveCampusQr(content, locationsRef.current);
      if (resolution.ok) {
        onResolvedRef.current(resolution.location);
        onCloseRef.current();
        return;
      }

      setResultMessage(resolution.message);
      setStatus('result-error');
    };

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        video,
        (result) => {
          if (result) handleContent(result.getText());
        },
      )
      .then((scannerControls) => {
        if (cancelled || timedOut) {
          scannerControls.stop();
          return;
        }
        window.clearTimeout(startTimeout);
        controls = scannerControls;
        setStatus('scanning');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        window.clearTimeout(startTimeout);
        setStatus(cameraErrorStatus(error));
      });

    return () => {
      cancelled = true;
      window.clearTimeout(startTimeout);
      controls?.stop();
      handledRef.current = false;
      stopStream(video);
    };
  }, [open, started]);

  const startCamera = (): void => {
    setResultMessage('');
    setStatus('starting');
    setStarted(true);
  };

  const stopCamera = (): void => {
    stopStream(videoRef.current);
    setStarted(false);
    setStatus('idle');
  };

  const useSearch = (): void => {
    stopCamera();
    onSearchInstead();
    onClose();
  };

  const isCameraView = status === 'starting' || status === 'scanning';
  const errorCopy =
    status === 'denied' || status === 'no-camera' || status === 'in-use' || status === 'error'
      ? ERROR_COPY[status]
      : null;

  return (
    <Modal
      open={open}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="Scan campus QR"
      description="Camera access is requested only after you choose to scan."
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        {status === 'idle' ? (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold-500/20 text-gold-600">
              <Camera aria-hidden="true" className="h-7 w-7" />
            </span>
            <h3 className="mt-3 text-base font-extrabold text-navy-900">
              Scan a code at a campus location
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              Start the camera and point it at a campus QR code. The place opens on the map
              with its details and directions. The video stream stops as soon as a code is read
              or this dialog closes.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800"
              >
                <Camera aria-hidden="true" className="h-4 w-4" />
                Start camera
              </button>
              <button
                type="button"
                onClick={useSearch}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-slate-50"
              >
                <Search aria-hidden="true" className="h-4 w-4" />
                Search for a place instead
              </button>
            </div>
            <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-2.5 text-left text-[10px] leading-relaxed text-slate-500">
              <p>{QR_FORMAT_HINT}</p>
              <p>{INDOOR_QR_HINT}</p>
            </div>
          </div>
        ) : null}

        {isCameraView ? (
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label="Camera preview for scanning a campus QR code"
                className="aspect-[4/3] w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-white/70"
              />
              {status === 'starting' ? (
                <div className="absolute inset-0 grid place-items-center bg-black/60">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    Starting camera…
                  </span>
                </div>
              ) : null}
            </div>
            <p
              role="status"
              aria-live="polite"
              className="mt-2 text-center text-xs font-medium text-slate-600"
            >
              {status === 'scanning'
                ? 'Point the camera at a campus QR code and hold it steady.'
                : 'Waiting for the camera…'}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-slate-50"
              >
                <CameraOff aria-hidden="true" className="h-4 w-4" />
                Stop camera
              </button>
              <button
                type="button"
                onClick={useSearch}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                Search for a place instead
              </button>
            </div>
          </div>
        ) : null}

        {errorCopy ? (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
              {status === 'denied' ? (
                <ShieldAlert aria-hidden="true" className="h-7 w-7" />
              ) : (
                <VideoOff aria-hidden="true" className="h-7 w-7" />
              )}
            </span>
            <h3 className="mt-3 text-base font-extrabold text-navy-900">{errorCopy.title}</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              {errorCopy.body}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Try again
              </button>
              <button
                type="button"
                onClick={useSearch}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-slate-50"
              >
                <Search aria-hidden="true" className="h-4 w-4" />
                Search manually
              </button>
            </div>
          </div>
        ) : null}

        {status === 'result-error' ? (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <ShieldAlert aria-hidden="true" className="h-7 w-7" />
            </span>
            <h3 className="mt-3 text-base font-extrabold text-navy-900">
              That code is not a campus location
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              {resultMessage}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800"
              >
                <Camera aria-hidden="true" className="h-4 w-4" />
                Scan another code
              </button>
              <button
                type="button"
                onClick={useSearch}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-slate-50"
              >
                <Search aria-hidden="true" className="h-4 w-4" />
                Search manually
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
