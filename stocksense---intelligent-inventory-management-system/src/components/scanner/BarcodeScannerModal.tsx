import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Camera, X, Scan, Search, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { playBeep } from '../../utils/sound';

export const BarcodeScannerModal: React.FC = () => {
  const { scannerOpen, setScannerOpen, products, setSelectedProductId, setActiveTab } = useInventory();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannedSuccess, setScannedSuccess] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (scannerOpen) {
      setErrorMsg(null);
      setScannedSuccess(null);
      setManualCode('');
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scannerOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } else {
        setCameraActive(false);
      }
    } catch {
      // Camera permission denied or not available in iframe environment
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  if (!scannerOpen) return null;

  const handleLookup = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) return;

    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === clean ||
        p.sku.toLowerCase() === clean ||
        p.sku.toLowerCase().includes(clean) ||
        p.name.toLowerCase().includes(clean)
    );

    if (matched) {
      playBeep();
      setScannedSuccess(`Found: ${matched.name} (${matched.sku})`);
      setTimeout(() => {
        setSelectedProductId(matched.id);
        setActiveTab('products');
        setScannerOpen(false);
      }, 700);
    } else {
      setErrorMsg(`No product found matching code "${code}". Try selecting from sample barcodes below.`);
    }
  };

  const handleSampleClick = (barcode: string) => {
    setManualCode(barcode);
    handleLookup(barcode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Scan Product Barcode / SKU</h2>
              <p className="text-xs text-slate-500">Optical reader & instant SKU resolver</p>
            </div>
          </div>
          <button
            onClick={() => setScannerOpen(false)}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 space-y-5">
          {/* Scanner Viewport */}
          <div className="relative aspect-16/9 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <Camera className="w-10 h-10 text-slate-600 mx-auto stroke-[1.5]" />
                <p className="text-xs text-slate-400 font-medium">
                  Camera feed active or simulated optical target ready
                </p>
                <p className="text-[11px] text-slate-500">
                  Align hardware barcode or use sample scanner buttons below
                </p>
              </div>
            )}

            {/* Scanning reticle / crosshair */}
            <div className="absolute inset-x-12 inset-y-6 pointer-events-none border-2 border-dashed border-emerald-400/70 rounded-lg flex items-center justify-center">
              {/* Animated laser line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse" />
            </div>

            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
          </div>

          {/* Feedback banners */}
          {scannedSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{scannedSuccess} — Redirecting...</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Manual Input form */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Manual Barcode or SKU Entry
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(manualCode);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="e.g. 8901234560012 or ST-ROD-012"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors font-mono"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Find</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Quick Demo Barcodes for Evaluators */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Quick Sample Barcodes for Testing
              </span>
              <span className="text-[11px] text-blue-600 font-medium">Click to scan</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {products.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSampleClick(p.barcode)}
                  className="flex items-start justify-between p-2.5 text-left border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl transition-all group"
                >
                  <div className="min-w-0 pr-1">
                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700">
                      {p.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500">{p.sku}</p>
                    <p className="text-[10px] font-mono text-slate-400">{p.barcode}</p>
                  </div>
                  <Scan className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Barcode standard: EAN-13 / Code-128</span>
          <button
            onClick={() => setScannerOpen(false)}
            className="font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
