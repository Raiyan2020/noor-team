import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Search, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { DASHBOARD_API_BASE_URL } from '../lib/apiConfig';
import { http } from '../services/http';

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);  // true only when .start() has resolved
  const isMountedRef = useRef(true);

  // Parse QR code data to extract user ID
  const parseQRData = (data: string): string | null => {
    try {
      if (data.startsWith('noor://account/')) {
        return data.replace('noor://account/', '').trim();
      }
      const parsed = JSON.parse(data);
      if (parsed.type === 'client' && parsed.id) return parsed.id;
      if (parsed.id) return parsed.id;
    } catch {
      // Not JSON
    }
    if (data.startsWith('client:')) {
      return data.replace('client:', '').trim();
    }
    return data.trim() || null;
  };

  /**
   * Safely stop the scanner. Only calls .stop() if the scanner is actually running.
   * Returns a promise that resolves when the scanner is fully stopped.
   */
  const safeStop = useCallback(async () => {
    if (scannerRef.current && isRunningRef.current) {
      isRunningRef.current = false;
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // Ignore — scanner may have already been stopped
      }
      scannerRef.current = null;
      if (isMountedRef.current) setScanning(false);
    }
  }, []);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (!isMountedRef.current) return;
    if (decodedText === lastScan) return;
    setLastScan(decodedText);

    const userId = parseQRData(decodedText);
    if (!userId) {
      setError('كود QR غير صالح');
      setTimeout(() => { if (isMountedRef.current) { setError(''); setLastScan(''); } }, 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await http.get(`${DASHBOARD_API_BASE_URL}/users/${userId}`);
      if (!isMountedRef.current) return;

      if (response.data?.data) {
        await safeStop();
        setLastScan('');
        setError('');
        navigate(`/client/${userId}`);
      } else {
        setError(`لم يتم العثور على عميلة بالكود: ${userId}`);
        setTimeout(() => { if (isMountedRef.current) { setError(''); setLastScan(''); } }, 3000);
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      if (isMountedRef.current) {
        setError('حدث خطأ في تحميل بيانات العميلة');
        setTimeout(() => { if (isMountedRef.current) { setError(''); setLastScan(''); } }, 3000);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [lastScan, navigate, safeStop]);

  const startScanning = useCallback(async () => {
    // Don't start if already running or unmounted
    if (isRunningRef.current || !isMountedRef.current) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => { /* ignore frame errors */ }
      );

      // Only mark as running if still mounted
      if (isMountedRef.current) {
        isRunningRef.current = true;
        setScanning(true);
        setCameraError('');
      } else {
        // Component unmounted during start — stop immediately
        await html5QrCode.stop().catch(() => {});
        scannerRef.current = null;
      }
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      scannerRef.current = null;
      if (!isMountedRef.current) return;

      const msg = err?.toString() ?? '';
      if (msg.includes('NotAllowedError')) {
        setCameraError('تم رفض الوصول إلى الكاميرا. الرجاء السماح بالوصول للكاميرا في إعدادات المتصفح.');
      } else if (msg.includes('NotFoundError')) {
        setCameraError('لم يتم العثور على كاميرا. الرجاء التأكد من توصيل الكاميرا.');
      } else {
        setCameraError('حدث خطأ في الكاميرا. حاول مرة أخرى.');
      }
    }
  }, [handleScanSuccess]);

  useEffect(() => {
    isMountedRef.current = true;
    setLastScan('');
    setError('');
    setCameraError('');

    startScanning();

    return () => {
      isMountedRef.current = false;
      // safeStop guards against calling .stop() when not running
      safeStop();
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const userId = manualCode.replace('client:', '').trim();

    try {
      setLoading(true);
      setError('');
      const response = await http.get(`${DASHBOARD_API_BASE_URL}/users/${userId}`);
      if (response.data?.data) {
        navigate(`/client/${userId}`);
      } else {
        setError('لم يتم العثور على عميلة بهذا الكود');
      }
    } catch {
      setError('لم يتم العثور على عميلة بهذا الكود');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setCameraError('');
    setError('');
    setLastScan('');
    startScanning();
  };

  return (
    <div className="flex flex-col h-screen bg-black relative">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white"
        >
          <ArrowRight size={20} />
        </button>
        <span className="text-white font-semibold">مسح الكود</span>
        <div className="w-10" />
      </div>

      {/* Scanner Viewport */}
      <div className="flex-1 relative flex flex-col items-center justify-center">
        {/* Camera Feed Container */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
              <p className="text-white/90 text-sm leading-relaxed mb-6">{cameraError}</p>
              <button
                onClick={handleRetry}
                className="bg-app-gold text-white px-6 py-3 rounded-full font-semibold hover:scale-95 transition-transform"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <div id="qr-reader" className="w-full h-full" />
          )}
        </div>

        {/* Scan Frame Overlay */}
        {scanning && !cameraError && (
          <div className="relative z-10 w-64 h-64 border-2 border-app-gold/50 rounded-3xl flex items-center justify-center pointer-events-none">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-r-4 border-app-gold rounded-tr-xl -mt-1 -mr-1 rotate-[270deg]" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-app-gold rounded-tr-xl -mt-1 -mr-1" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-t-4 border-r-4 border-app-gold rounded-tr-xl -mt-1 -mr-1 rotate-[180deg]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-t-4 border-r-4 border-app-gold rounded-tr-xl -mt-1 -mr-1 rotate-[90deg]" />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-app-gold shadow-[0_0_8px_rgba(197,179,88,0.8)] animate-[scan_2s_infinite_linear]" />
            <p className="text-white/70 text-xs font-semibold mt-32 animate-pulse">جاري البحث عن كود...</p>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="absolute bottom-40 z-20 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-xs font-semibold animate-pulse">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute bottom-40 z-20 bg-app-gold/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-xs font-semibold flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري التحقق...</span>
          </div>
        )}
      </div>

      {/* Manual Entry Sheet */}
      <div className="bg-white rounded-t-[32px] p-8 pb-12 z-20 -mt-6">
        <h3 className="text-lg font-semibold text-app-text mb-4 text-center">أو ادخال يدوي</h3>
        <form onSubmit={handleManualSubmit} className="relative">
          <input
            type="text"
            placeholder="رقم العميل / الكود"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-app-gold focus:bg-white transition-all text-center font-mono font-semibold text-lg"
            value={manualCode}
            onChange={(e) => { setManualCode(e.target.value); setError(''); }}
          />
          <button
            type="submit"
            className="absolute left-2 top-2 bottom-2 aspect-square bg-app-gold text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-95 transition-transform"
          >
            <Search size={20} />
          </button>
        </form>
        {error && <p className="text-red-500 text-xs font-semibold text-center mt-3">{error}</p>}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        #qr-reader__dashboard_section { display: none !important; }
        #qr-reader__dashboard_section_csr { display: none !important; }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}</style>
    </div>
  );
};

export default ScanPage;
