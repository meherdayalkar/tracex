import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, X, RefreshCw, AlertCircle, Upload, Zap, ZapOff, Scan, ShieldCheck 
} from 'lucide-react';

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const fallbackInputRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [loading, setLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Stop camera tracks safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  }, []);

  // Check available camera devices
  const checkCameraDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }
    } catch (e) {
      console.warn('Unable to enumerate devices:', e);
    }
  }, []);

  // Start video stream
  const startCamera = useCallback(async () => {
    setLoading(true);
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live camera access is not supported by your browser or connection. Please upload a photo or use HTTPS.');
      setLoading(false);
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const capabilities = track.getCapabilities();
        if (capabilities && capabilities.torch) {
          setTorchSupported(true);
        }
      }

      await checkCameraDevices();
    } catch (err) {
      console.error('Camera access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser or select an image file directly.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device was detected on your system. You can upload a photo of the label instead.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is currently being used by another application. Please close other camera tabs and try again.');
      } else {
        setCameraError(`Unable to open camera (${err.message || err.name}). Please use file upload instead.`);
      }
    } finally {
      setLoading(false);
    }
  }, [facingMode, stopCamera, checkCameraDevices]);

  // Trigger camera start on open
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Toggle front/rear camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle flashlight / torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && typeof track.applyConstraints === 'function') {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (err) {
        console.warn('Torch toggle failed:', err);
      }
    }
  };

  // Capture current video frame to Blob/File
  const handleSnap = () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    const video = videoRef.current;

    try {
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      // If user camera, mirror it horizontally so photo matches preview
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsCapturing(false);
            return;
          }

          const file = new File(
            [blob],
            `label_capture_${Date.now()}.jpg`,
            { type: 'image/jpeg' }
          );

          stopCamera();
          onCapture(file);
          onClose();
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Snapshot capture failed:', err);
      setIsCapturing(false);
    }
  };

  // Fallback upload trigger
  const handleFallbackFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      onCapture(file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div 
        className="relative w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 text-white border-b border-slate-800 z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-white">
                  Packaging Scanner Viewfinder
                </span>
                {!cameraError && !loading && (
                  <span className="flex items-center gap-1 text-[9px] font-mono-audit text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Point at package label, MRP panel, or declaration block
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Flash / Torch Toggle */}
            {torchSupported && !cameraError && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  torchOn 
                    ? 'bg-amber-400 text-slate-950' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Toggle Flashlight"
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Switch Camera (Front/Back) */}
            {hasMultipleCameras && !cameraError && (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close Viewfinder"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Video Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[340px] sm:min-h-[420px] overflow-hidden">
          {/* Live Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Optical Targeting Reticle Overlay */}
          {!cameraError && !loading && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              {/* Central Framing Box */}
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/3] rounded-xl border-2 border-dashed border-amber-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* 4 Corner Bracket Accents */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl-sm"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr-sm"></div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl-sm"></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br-sm"></div>

                {/* Animated Laser Scanning Line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#fbbf24] animate-[bounce_2.5s_infinite]"></div>

                {/* Center Targeting Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <Scan className="w-10 h-10 text-amber-400" />
                </div>
              </div>

              <div className="mt-3 px-3 py-1 bg-slate-950/80 backdrop-blur-xs rounded-full border border-slate-700 text-center">
                <span className="text-[11px] font-medium text-slate-200">
                  Align product packaging label inside box
                </span>
              </div>
            </div>
          )}

          {/* Loading Camera State */}
          {loading && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-20">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
              <div className="text-sm font-semibold text-white">Opening Camera Sensor...</div>
              <p className="text-xs text-slate-400 mt-1">Please grant camera permissions if prompted</p>
            </div>
          )}

          {/* Camera Error / Permission Blocked State */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Camera Access Unavailable</h4>
              <p className="text-xs text-slate-300 max-w-xs mb-4 leading-relaxed">
                {cameraError}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => fallbackInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo from Device</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          )}

          {/* Shutter Click Flash Animation */}
          {isCapturing && (
            <div className="absolute inset-0 bg-white animate-fade-out pointer-events-none z-30"></div>
          )}
        </div>

        {/* Bottom Shutter & Controls Toolbar */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 z-10">
          {/* Choose from gallery/files */}
          <button
            type="button"
            onClick={() => fallbackInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Upload File</span>
          </button>

          {/* Main Shutter Button */}
          <button
            type="button"
            onClick={handleSnap}
            disabled={loading || !!cameraError || isCapturing}
            className="group relative flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white/80 hover:border-white p-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg active:scale-95"
            title="Snap Packaging Photo"
          >
            <div className="w-full h-full rounded-full bg-amber-400 group-hover:bg-amber-300 group-active:bg-amber-500 flex items-center justify-center text-slate-950 shadow-inner transition-colors">
              <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </button>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Hidden Fallback File Input */}
        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFallbackFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
