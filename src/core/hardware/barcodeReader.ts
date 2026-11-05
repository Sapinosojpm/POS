import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export class BarcodeScannerEngine {
  private zxingReader: BrowserMultiFormatReader | null = null;
  private currentStream: MediaStream | null = null;
  private isDetecting = false;
  private barcodeDetectorInstance: any = null;

  constructor() {
    // Configure ZXing hints for retail formats
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    try {
      this.zxingReader = new BrowserMultiFormatReader(hints);
    } catch (e) {
      console.warn('ZXing reader init failed:', e);
    }

    // Initialize native BarcodeDetector if supported
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        this.barcodeDetectorInstance = new BarcodeDetectorClass({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
      } catch (e) {
        console.warn('Native BarcodeDetector init failed:', e);
      }
    }
  }

  public async getAvailableCameras(): Promise<CameraDevice[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
    } catch {
      return [];
    }
  }

  public async startCamera(
    videoElement: HTMLVideoElement,
    facingMode: 'environment' | 'user' = 'environment',
    deviceId?: string
  ): Promise<MediaStream> {
    this.stopCamera(videoElement);

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.currentStream = stream;
    videoElement.srcObject = stream;
    videoElement.setAttribute('playsinline', 'true');
    await videoElement.play();
    return stream;
  }

  public stopCamera(videoElement?: HTMLVideoElement | null): void {
    this.isDetecting = false;
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
    if (this.zxingReader) {
      try {
        this.zxingReader.reset();
      } catch {
        // Safe reset
      }
    }
  }

  public hasTorchCapability(): boolean {
    if (!this.currentStream) return false;
    const track = this.currentStream.getVideoTracks()[0];
    if (!track) return false;
    const capabilities = track.getCapabilities?.() as any;
    return !!capabilities?.torch;
  }

  public async setTorch(enabled: boolean): Promise<boolean> {
    if (!this.currentStream) return false;
    const track = this.currentStream.getVideoTracks()[0];
    if (!track) return false;

    try {
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities && capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: enabled } as any],
        });
        return true;
      }
    } catch (e) {
      console.warn('Failed to set torch constraint:', e);
    }
    return false;
  }

  /**
   * Start decoding frames using native BarcodeDetector or ZXing
   */
  public startDecoding(
    videoElement: HTMLVideoElement,
    onBarcodeDetected: (code: string) => void
  ): () => void {
    this.isDetecting = true;
    let animationFrameId: number;
    let lastScanTime = 0;

    const scanLoop = async () => {
      if (!this.isDetecting) return;

      const now = Date.now();
      // Scan every 150ms for low CPU and high responsiveness
      if (now - lastScanTime > 150 && videoElement.readyState >= 2) {
        lastScanTime = now;

        // Try native BarcodeDetector first
        if (this.barcodeDetectorInstance) {
          try {
            const detected = await this.barcodeDetectorInstance.detect(videoElement);
            if (detected && detected.length > 0 && this.isDetecting) {
              const raw = detected[0].rawValue;
              if (raw) {
                onBarcodeDetected(raw);
              }
            }
          } catch {
            // Fallback to ZXing if frame detection throws
          }
        } else if (this.zxingReader) {
          // ZXing fallback
          try {
            const result = this.zxingReader.decode(videoElement);
            if (result && this.isDetecting) {
              onBarcodeDetected(result.getText());
            }
          } catch {
            // No barcode in frame, normal loop
          }
        }
      }

      if (this.isDetecting) {
        animationFrameId = requestAnimationFrame(scanLoop);
      }
    };

    animationFrameId = requestAnimationFrame(scanLoop);

    return () => {
      this.isDetecting = false;
      cancelAnimationFrame(animationFrameId);
    };
  }
}
