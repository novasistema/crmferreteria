import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, Camera } from 'lucide-react';

// Lector de código de barras con la cámara del celular.
// Usa el lector nativo del navegador si existe (Chrome en Android) y si no, la librería ZXing (iPhone, otros).
interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'codabar', 'qr_code'];

const cameraError = (e: unknown) => {
  const name = (e as any)?.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'No se dio permiso para usar la cámara. Permitilo en el navegador y probá de nuevo.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No se encontró una cámara en este dispositivo.';
  return 'No se pudo iniciar la cámara.';
};

export const BarcodeScanner: React.FC<Props> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const doneRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let zxingControls: { stop: () => void } | null = null;
    let cancelled = false;

    const report = (code: string) => {
      const c = code.trim();
      if (!c || doneRef.current || cancelled) return;
      doneRef.current = true;
      try { navigator.vibrate?.(80); } catch { /* sin vibración */ }
      onDetectedRef.current(c);
    };

    (async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setError('La cámara solo funciona en una página segura (https) y con un navegador compatible.');
        return;
      }
      try {
        const Native = (window as any).BarcodeDetector;
        if (Native) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
          if (cancelled) return;
          const video = videoRef.current!;
          video.srcObject = stream;
          await video.play();
          const supported: string[] = (await Native.getSupportedFormats?.()) || NATIVE_FORMATS;
          const detector = new Native({ formats: NATIVE_FORMATS.filter(f => supported.includes(f)) });
          setStatus('scanning');
          const loop = async () => {
            if (cancelled || doneRef.current) return;
            try {
              const found = await detector.detect(video);
              if (found?.[0]?.rawValue) return report(found[0].rawValue);
            } catch { /* cuadro sin código */ }
            timer = window.setTimeout(loop, 200);
          };
          loop();
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          const reader = new BrowserMultiFormatReader();
          zxingControls = await reader.decodeFromConstraints(
            { video: { facingMode: { ideal: 'environment' } }, audio: false },
            videoRef.current!,
            result => { if (result) report(result.getText()); }
          );
          if (cancelled) zxingControls.stop();
          else setStatus('scanning');
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setError(cameraError(e));
        }
      }
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      zxingControls?.stop();
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <div className="font-bold flex items-center gap-2"><Camera className="w-5 h-5" /> Escanear código</div>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10" aria-label="Cerrar"><X className="w-5 h-5" /></button>
      </div>
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        {status === 'scanning' && <div className="relative w-72 h-40 border-2 border-white/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />}
        {status === 'starting' && <Loader2 className="relative w-8 h-8 text-white animate-spin" />}
        {status === 'error' && <div className="relative mx-6 p-4 rounded-2xl bg-white text-sm text-slate-700">{error}</div>}
      </div>
      <form
        onSubmit={e => { e.preventDefault(); if (manual.trim()) onDetectedRef.current(manual.trim()); }}
        className="p-4 flex gap-2 bg-black"
      >
        <input value={manual} onChange={e => setManual(e.target.value)} inputMode="numeric" placeholder="O escribí el código" className="flex-1 rounded-xl px-3 py-3 text-base bg-white/10 text-white placeholder:text-white/50 outline-hidden" />
        <button className="px-4 rounded-xl bg-white text-black font-bold">Buscar</button>
      </form>
    </div>
  );
};
