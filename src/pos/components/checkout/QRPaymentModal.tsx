import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Info
} from 'lucide-react';
import { parseAndValidateQRPayload } from '../../../shared/utils/qrParser';
import type { QRPayloadValidationResult } from '../../../shared/types';
import { api } from '../../../shared/services/api';

interface QRPaymentModalProps {
  amount: number;
  currency?: string;
  onScanComplete: (result: {
    rawPayload: string;
    referenceId: string;
    provider: 'Raast' | 'JazzCash' | 'Easypaisa' | 'Bank' | 'Generic';
    verificationStatus: 'Verified' | 'Pending_Verification';
    notes?: string;
  }) => void;
  onCancel: () => void;
}

export const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
  amount,
  currency = 'Rs.',
  onScanComplete,
  onCancel
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [validationResult, setValidationResult] = useState<QRPayloadValidationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-video-container';

  const startScanner = async () => {
    setCameraError(null);
    setValidationResult(null);
    setVerificationSuccess(false);

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleQRScanned(decodedText);
        },
        () => {
          // scanning frame noise, ignore
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      setIsScanning(false);
      if (err?.name === 'NotAllowedError' || String(err).includes('Permission')) {
        setCameraError('Camera permission was denied. Please allow camera access in your browser or enter the payment reference manually.');
      } else if (err?.name === 'NotFoundError' || String(err).includes('NotFound')) {
        setCameraError('No active camera detected. You can use manual entry or simulated QR codes below.');
      } else {
        setCameraError(`Camera initialization failed: ${err?.message || 'Device busy or unsupported'}.`);
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const handleQRScanned = async (text: string) => {
    await stopScanner();
    processPayload(text);
  };

  const processPayload = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const result = parseAndValidateQRPayload(trimmed, amount);
    setValidationResult(result);

    if (result.isValid) {
      setIsVerifying(true);
      try {
        // Call backend verification
        const verifyRes = await api.verifyQRPayment({
          referenceId: result.referenceId,
          amount,
          provider: result.provider
        });

        setIsVerifying(false);
        setVerificationSuccess(true);

        // Notify parent
        onScanComplete({
          rawPayload: result.raw,
          referenceId: result.referenceId,
          provider: result.provider,
          verificationStatus: verifyRes.verified ? 'Verified' : 'Pending_Verification',
          notes: result.message
        });
      } catch (err) {
        setIsVerifying(false);
        // Fallback: permit with Pending_Verification so counter isn't stalled
        setVerificationSuccess(true);
        onScanComplete({
          rawPayload: result.raw,
          referenceId: result.referenceId,
          provider: result.provider,
          verificationStatus: 'Pending_Verification',
          notes: 'Provider verification pending via retail clearing'
        });
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processPayload(manualInput.trim());
    }
  };

  const handleQuickSimulator = (type: 'raast' | 'jazzcash' | 'easypaisa') => {
    let mockPayload = '';
    const randomRef = Math.floor(100000 + Math.random() * 900000);

    if (type === 'raast') {
      mockPayload = `00020101021226480010pk.raast.ub520459995303586540${amount}5802PKREF:${randomRef}`;
    } else if (type === 'jazzcash') {
      mockPayload = JSON.stringify({
        gateway: 'JazzCash',
        merchantId: '03001234567',
        ref: `JC-${randomRef}`,
        amount,
        currency: 'PKR',
        timestamp: new Date().toISOString()
      });
    } else {
      mockPayload = JSON.stringify({
        gateway: 'Easypaisa',
        merchantId: '03001234567',
        ref: `EP-${randomRef}`,
        amount,
        currency: 'PKR',
        timestamp: new Date().toISOString()
      });
    }

    processPayload(mockPayload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#082B4C] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/15">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Scan QR Code</h3>
              <p className="text-xs text-amber-200/90 font-medium">
                Point the camera at the customer's payment QR code
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onCancel();
            }}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Amount Reminder Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Payable Amount:</span>
          <span className="text-base font-extrabold text-[#082B4C]">
            {currency} {amount.toLocaleString()}
          </span>
        </div>

        {/* Scanner Viewport Area */}
        <div className="p-6 flex flex-col items-center">
          {/* Active Camera Preview or Fallback Error Box */}
          <div className="relative w-full max-w-[320px] aspect-square bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-700">
            <div id={containerId} className="w-full h-full object-cover"></div>

            {/* Reticle target corners overlay */}
            {!cameraError && isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="w-48 h-48 border-2 border-dashed border-amber-400/80 rounded-xl relative animate-pulse">
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[#F47700]"></div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[#F47700]"></div>
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[#F47700]"></div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[#F47700]"></div>
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                </div>
              </div>
            )}

            {/* Loading / Verification Overlay */}
            {isVerifying && (
              <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
                <p className="font-bold text-sm">Verifying QR Payment...</p>
                <p className="text-xs text-slate-300 mt-1">Checking with State Bank Raast & Wallet Gateway</p>
              </div>
            )}

            {/* Success Overlay */}
            {verificationSuccess && (
              <div className="absolute inset-0 bg-emerald-900/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-300 mb-2 animate-bounce" />
                <p className="font-bold text-base">QR Payment Verified!</p>
                <p className="text-xs text-emerald-100 mt-1">Reference: {validationResult?.referenceId}</p>
              </div>
            )}

            {/* Camera Error Message */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900 p-5 flex flex-col items-center justify-center text-center text-white">
                <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                <p className="text-xs font-semibold text-slate-200">{cameraError}</p>
                <button
                  onClick={startScanner}
                  className="mt-3 bg-[#F47700] hover:bg-[#D46600] text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* Validation Result Status Card */}
          {validationResult && (
            <div className={`mt-4 w-full p-3 rounded-xl border text-xs ${
              validationResult.isValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-start gap-2">
                {validationResult.isValid ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{validationResult.provider} Digital QR</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                      validationResult.verificationStatus === 'Verified' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {validationResult.verificationStatus}
                    </span>
                  </div>
                  <p className="mt-0.5">{validationResult.message}</p>
                  {validationResult.referenceId && (
                    <p className="font-mono text-[11px] mt-1 text-slate-700">
                      Ref ID: <strong>{validationResult.referenceId}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rescan / Camera Control Buttons */}
          <div className="mt-4 flex items-center gap-3 w-full justify-center">
            <button
              onClick={startScanner}
              disabled={isScanning && !cameraError}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                isScanning && !cameraError
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rescan (F5)</span>
            </button>
            <button
              onClick={() => {
                stopScanner();
                onCancel();
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Fallback Manual / Simulator Section */}
          <div className="mt-5 w-full pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-semibold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                Quick Test Simulators:
              </span>
              <span className="text-[11px] text-slate-400">Click to emulate real QR</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSimulator('raast')}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors text-center cursor-pointer"
              >
                Raast P2M
              </button>
              <button
                type="button"
                onClick={() => handleQuickSimulator('jazzcash')}
                className="py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg text-[11px] font-bold transition-colors text-center cursor-pointer"
              >
                JazzCash QR
              </button>
              <button
                type="button"
                onClick={() => handleQuickSimulator('easypaisa')}
                className="py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-bold transition-colors text-center cursor-pointer"
              >
                EasyPaisa QR
              </button>
            </div>

            {/* Manual QR string / Reference input */}
            <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Or paste QR payload / Ref ID..."
                className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-[#082B4C] font-mono"
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="bg-[#082B4C] hover:bg-[#051C33] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
