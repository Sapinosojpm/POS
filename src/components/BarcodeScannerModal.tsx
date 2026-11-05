import React, { useEffect, useRef, useState } from 'react';
import {
  Scan,
  X,
  Zap,
  ZapOff,
  SwitchCamera,
  Layers,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  ArrowRight
} from 'lucide-react';
import { BarcodeScannerEngine, CameraDevice } from '../core/hardware/barcodeReader';
import { playScanSuccessSound, triggerHaptic } from '../core/hardware/scannerFeedback';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  subtitle?: string;
  defaultContinuous?: boolean;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Product Barcode',
  subtitle = 'Point camera at any standard retail barcode (EAN, UPC, Code 128)',
  defaultContinuous = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerEngineRef = useRef<BarcodeScannerEngine | null>(null);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isContinuous, setIsContinuous] = useState(defaultContinuous);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentScan, setRecentScan] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Debounce tracking for continuous scanning
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  // Initialize engine
  if (!scannerEngineRef.current) {
    scannerEngineRef.current = new BarcodeScannerEngine();
  }

  // Handle camera stream setup
  useEffect(() => {
    if (!isOpen) {
      if (scannerEngineRef.current) {
        scannerEngineRef.current.stopCamera(videoRef.current);
      }
      setIsTorchOn(false);
      setCameraError(null);
      setRecentScan(null);
      return;
    }

    let isSubscribed = true;
    let stopDecoding: (() => void) | null = null;

    const setupCamera = async () => {
      try {
        setCameraError(null);
        const engine = scannerEngineRef.current;
        if (!engine || !videoRef.current) return;

        // Fetch available camera devices
        const devList = await engine.getAvailableCameras();
        if (isSubscribed) {
          setCameras(devList);
          if (!selectedCameraId && devList.length > 0) {
            // Prefer rear/environment camera
            const rear = devList.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
            );
            if (rear) {
              setSelectedCameraId(rear.deviceId);
            }
          }
        }

        // Start video stream
        await engine.startCamera(videoRef.current, 'environment', selectedCameraId);

        if (!isSubscribed) return;

        // Check torch capabilities
        setHasTorch(engine.hasTorchCapability());

        // Start frame decoding loop
        stopDecoding = engine.startDecoding(videoRef.current, (scannedCode) => {
          if (!scannedCode || !scannedCode.trim()) return;

          const now = Date.now();
          const cleanCode = scannedCode.trim();

          // 1.2-second debounce on the identical barcode in continuous mode
          if (
            cleanCode === lastScannedCodeRef.current &&
            now - lastScannedTimeRef.current < 1200
          ) {
            return;
          }

          lastScannedCodeRef.current = cleanCode;
          lastScannedTimeRef.current = now;

          // Feedback
          playScanSuccessSound();
          triggerHaptic('success');
          setRecentScan(cleanCode);

          // Clear recent scan badge after 1.8s
          setTimeout(() => {
            setRecentScan((prev) => (prev === cleanCode ? null : prev));
          }, 1800);

          onScan(cleanCode);

          if (!isContinuous) {
            onClose();
          }
        });
      } catch (err: any) {
        if (!isSubscribed) return;
        console.error('Camera startup error:', err);
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Please enable camera access in your browser or device settings.'
            : 'Unable to access device camera. You can still scan via USB gun or enter code manually.'
        );
      }
    };

    setupCamera();

    return () => {
      isSubscribed = false;
      if (stopDecoding) {
        stopDecoding();
      }
      if (scannerEngineRef.current) {
        scannerEngineRef.current.stopCamera(videoRef.current);
      }
    };
  }, [isOpen, selectedCameraId, isContinuous, onScan, onClose]);

  // Torch toggle
  const toggleTorch = async () => {
    if (!scannerEngineRef.current || !hasTorch) return;
    const nextTorch = !isTorchOn;
    const ok = await scannerEngineRef.current.setTorch(nextTorch);
    if (ok) {
      setIsTorchOn(nextTorch);
    }
  };

  // Cycle camera devices
  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].deviceId);
  };

  // Submit manual code
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const code = manualCode.trim();
    playScanSuccessSound();
    triggerHaptic('success');
    setRecentScan(code);
    onScan(code);
    setManualCode('');
    if (!isContinuous) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full overflow-hidden text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-wide">{title}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-1">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
            title="Close scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Screen */}
        <div className="relative bg-black w-full aspect-4/3 sm:aspect-square flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center max-w-xs">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-200 mb-4">{cameraError}</p>
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                <Keyboard className="w-3.5 h-3.5" />
                Enter Code Manually
              </button>
            </div>
          ) : (
            <>
              {/* Live Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
              />

              {/* Aiming Reticle Frame */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-48 border-2 border-blue-500/70 rounded-2xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

                  {/* Animated Laser Sweep Beam */}
                  <div className="animate-scanner-laser w-full left-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_10px_#38bdf8]" />
                </div>
              </div>

              {/* Top Floating Controls */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2">
                  {hasTorch && (
                    <button
                      onClick={toggleTorch}
                      className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
                        isTorchOn
                          ? 'bg-amber-500 text-slate-900 shadow-[0_0_12px_#f59e0b]'
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                      title={isTorchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
                    >
                      {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                    </button>
                  )}

                  {cameras.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-colors"
                      title="Switch camera"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Mode Selector Pill */}
                <button
                  onClick={() => setIsContinuous(!isContinuous)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
                    isContinuous
                      ? 'bg-blue-600/90 text-white border border-blue-400/40 shadow-sm'
                      : 'bg-black/50 text-slate-300 border border-white/10 hover:bg-black/70'
                  }`}
                  title={isContinuous ? 'Switch to Single Scan' : 'Switch to Continuous Batch Scan'}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {isContinuous ? 'Batch Mode' : 'Single Scan'}
                </button>
              </div>

              {/* Scanned Success Notification Pill */}
              {recentScan && (
                <div className="absolute bottom-4 inset-x-4 flex justify-center pointer-events-none">
                  <div className="bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Scanned: {recentScan}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Toolbar & Manual Entry */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {/* Quick Demo Barcode Buttons for Rapid Testing */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Quick Test Barcodes:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playScanSuccessSound();
                  triggerHaptic('success');
                  setRecentScan('480000000001');
                  onScan('480000000001');
                  if (!isContinuous) onClose();
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
              >
                Pancakes
              </button>
              <button
                type="button"
                onClick={() => {
                  playScanSuccessSound();
                  triggerHaptic('success');
                  setRecentScan('480000001001');
                  onScan('480000001001');
                  if (!isContinuous) onClose();
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
              >
                Steak
              </button>
              <button
                type="button"
                onClick={() => {
                  playScanSuccessSound();
                  triggerHaptic('success');
                  setRecentScan('480000002001');
                  onScan('480000002001');
                  if (!isContinuous) onClose();
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
              >
                Coffee
              </button>
            </div>
          </div>

          {/* Manual Entry Form */}
          {showManualInput ? (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Type barcode or SKU..."
                autoFocus
                className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                Add <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Hardware gun ready anytime</span>
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
              >
                <Keyboard className="w-3.5 h-3.5" />
                Manual Entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
