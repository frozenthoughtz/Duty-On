import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  SwitchCamera, 
  Zap, 
  ZapOff, 
  UploadCloud, 
  Check, 
  X, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  Award, 
  Calendar, 
  Hash, 
  Building2, 
  AlertCircle,
  Eye,
  Sparkles
} from 'lucide-react';
import { DocumentItem } from '../types/dutyon';
import { useDutyOn } from '../context/DutyOnContext';

interface DocumentUploaderProps {
  onClose: () => void;
  defaultCategory?: string;
}

const CATEGORIES = [
  { id: 'Training', label: 'Training Certificate', icon: Award, defaultName: 'SASSETA Security Training Certificate', authority: 'SASSETA' },
  { id: 'Identification', label: 'Identification (ID/Passport)', icon: ShieldCheck, defaultName: 'National ID Smart Card', authority: 'Dept of Home Affairs' },
  { id: 'PSIRA', label: 'PSIRA Registration', icon: ShieldCheck, defaultName: 'PSIRA Grade Certificate', authority: 'PSIRA' },
  { id: 'Firearm', label: 'Firearm Competency', icon: Award, defaultName: 'SAPS Firearm Competency Certificate', authority: 'SAPS' },
  { id: 'Medical', label: 'Medical / Fitness', icon: FileText, defaultName: 'Occupational Fitness Certificate', authority: 'Health Practitioner' },
  { id: 'Clearance', label: 'Police Clearance', icon: ShieldCheck, defaultName: 'SAPS Criminal Record Clearance', authority: 'SAPS CRC' }
];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onClose, defaultCategory = 'Training' }) => {
  const { addDocument, officer, showToast } = useDutyOn();

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [docName, setDocName] = useState('SASSETA Security Training Certificate');
  const [certNumber, setCertNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('SASSETA');
  const [hasExpiry, setHasExpiry] = useState(true);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  // Camera & Capture state
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewfinderGuide, setViewfinderGuide] = useState<'certificate' | 'card'>('certificate');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update defaults when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const cat = CATEGORIES.find(c => c.id === catId);
    if (cat) {
      setDocName(cat.defaultName);
      setIssuingAuthority(cat.authority);
      if (catId === 'Identification') {
        setViewfinderGuide('card');
        setHasExpiry(false);
      } else {
        setViewfinderGuide('certificate');
        setHasExpiry(true);
      }
    }
  };

  // Play synthetic shutter sound
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // AudioContext muted/unsupported
    }
  };

  // Start Camera
  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });
      streamRef.current = mediaStream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Check torch support
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
      if (capabilities && 'torch' in capabilities) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Camera initialization failed:', err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser or select an image from your device.');
      } else {
        setCameraError('Unable to open live camera. You can choose a photo file from your device below.');
      }
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  // Switch Camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch constraint error:', err);
    }
  };

  // Capture Photo
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    playShutterSound();
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 150);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const maxDimension = 1200;
    let w = video.videoWidth || 1280;
    let h = video.videoHeight || 960;

    if (w > maxDimension || h > maxDimension) {
      if (w > h) {
        h = Math.round((h * maxDimension) / w);
        w = maxDimension;
      } else {
        w = Math.round((w * maxDimension) / h);
        h = maxDimension;
      }
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw frame
      ctx.drawImage(video, 0, 0, w, h);

      // Watermark for official compliance audit
      const nowStr = new Date().toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
      ctx.fillStyle = 'rgba(11, 30, 48, 0.75)';
      ctx.fillRect(12, h - 34, 380, 24);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(`DutyOn Security Vault · ${nowStr} · ${officer?.name || 'Officer'}`, 20, h - 18);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        // Compress using canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            setCapturedImage(canvas.toDataURL('image/jpeg', 0.82));
          }
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Save to Firestore
  const handleSaveToFirestore = async () => {
    if (!docName.trim()) {
      showToast('Please specify a document title');
      return;
    }
    if (!capturedImage) {
      showToast('Please capture or upload a certificate photo first');
      return;
    }

    setIsSaving(true);

    const isExpiring = hasExpiry && expiryDate ? new Date(expiryDate).getTime() - Date.now() < 60 * 24 * 60 * 60 * 1000 : false;

    const iconTypeMap: Record<string, DocumentItem['iconType']> = {
      'Training': 'psira',
      'Identification': 'id',
      'PSIRA': 'psira',
      'Firearm': 'psira',
      'Medical': 'contract',
      'Clearance': 'warning'
    };

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: docName.trim(),
      category: selectedCategory,
      description: `${selectedCategory} · ${issuingAuthority || 'Verified Authority'} · Stored in Cloud`,
      type: 'PHOTO/CERT',
      iconType: iconTypeMap[selectedCategory] || 'psira',
      certificateNumber: certNumber.trim() || undefined,
      issuingAuthority: issuingAuthority.trim() || undefined,
      expiryDate: hasExpiry && expiryDate ? expiryDate : undefined,
      expiresSoon: isExpiring,
      officerId: officer?.id || 'off-1',
      officerName: officer?.name || 'Tshepo Maloa',
      verifiedBy: 'Officer In-App Verification',
      verifiedAt: new Date().toISOString(),
      photoUrl: capturedImage,
      fileData: capturedImage,
      capturedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      source: 'camera',
      notes: notes.trim() || undefined,
      status: 'valid'
    };

    try {
      addDocument(newDoc);
      showToast(`✓ Document "${newDoc.name}" stored in Firestore database!`);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error('Error saving document to cloud:', err);
      showToast('Error storing document in cloud. Retrying local cache.');
      setIsSaving(false);
    }
  };

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1E30]/85 backdrop-blur-md flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#0F2840] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#0B1E30]/60 flex-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 grid place-items-center text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-extrabold text-sm sm:text-base text-white">
                Officer Document Uploader
              </div>
              <div className="text-[11px] text-blue-200/70">
                Capture certificate or ID &amp; sync to Cloud Firestore
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4 text-xs">
          {/* Category Select Pills */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-blue-200/80 mb-2">
              1. Document Type &amp; Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-400/60 text-white shadow-xs'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="font-semibold text-[11px] leading-tight truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camera Viewfinder / Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider font-bold text-blue-200/80">
                2. Capture Document Photo
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Camera Ready
                </span>
              </div>
            </div>

            {/* Viewfinder Window */}
            <div className="relative w-full aspect-4/3 rounded-2xl bg-[#071320] border-2 border-white/15 overflow-hidden flex items-center justify-center shadow-inner group">
              {/* Shutter White Flash overlay */}
              {isShutterFlashing && (
                <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150" />
              )}

              {/* State A: Photo is captured */}
              {capturedImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={capturedImage}
                    alt="Captured certificate"
                    className="w-full h-full object-contain bg-black"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-[11px] text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Captured</span>
                  </div>
                  <button
                    onClick={handleRetake}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 hover:bg-black text-white px-4 py-2 rounded-xl border border-white/20 font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer backdrop-blur-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>
                </div>
              ) : cameraActive ? (
                /* State B: Live Camera Stream */
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Document Alignment Overlay (Certificate vs ID card) */}
                  <div className="absolute inset-0 pointer-events-none grid place-items-center p-6">
                    <div
                      className={`w-full border-2 border-dashed border-blue-400/70 rounded-xl flex flex-col justify-between p-3 transition-all ${
                        viewfinderGuide === 'card' ? 'aspect-16/10 max-w-[280px]' : 'aspect-4/3 max-w-[320px]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-blue-200/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs w-fit">
                        <span>Align {viewfinderGuide === 'card' ? 'ID Card' : 'Certificate'} edges</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="w-4 h-4 border-b-2 border-l-2 border-blue-400"></div>
                        <div className="w-4 h-4 border-b-2 border-r-2 border-blue-400"></div>
                      </div>
                    </div>
                  </div>

                  {/* Top Camera Controls */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20">
                    <button
                      type="button"
                      onClick={() => setViewfinderGuide(viewfinderGuide === 'certificate' ? 'card' : 'certificate')}
                      className="bg-black/60 hover:bg-black/80 text-white/90 px-2.5 py-1 rounded-lg border border-white/20 text-[10px] font-bold backdrop-blur-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Frame: {viewfinderGuide === 'card' ? 'ID Card' : 'A4 Cert'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {hasTorch && (
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                            torchOn ? 'bg-amber-500/80 border-amber-300 text-black' : 'bg-black/60 border-white/20 text-white'
                          }`}
                        >
                          {torchOn ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                        title="Switch Camera (Front/Back)"
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Shutter Capture Bar */}
                  <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 z-20">
                    <button
                      type="button"
                      onClick={takeSnapshot}
                      className="w-14 h-14 rounded-full bg-white hover:scale-105 active:scale-95 border-4 border-blue-500 flex items-center justify-center shadow-2xl transition-all cursor-pointer"
                      title="Capture Photo"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600"></div>
                    </button>
                  </div>
                </div>
              ) : (
                /* State C: Camera Inactive / Trigger Button */
                <div className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 grid place-items-center mx-auto">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Capture with Camera</div>
                    <div className="text-[11px] text-slate-300 max-w-xs mx-auto mt-0.5">
                      Point camera at your paper certificate, PSIRA card, or official ID document.
                    </div>
                  </div>

                  {cameraError && (
                    <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-2.5 text-amber-200 text-[11px] flex items-start gap-2 text-left">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-none mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 font-semibold text-xs border border-white/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Browse Photo</span>
                    </button>
                  </div>

                  {/* Hidden fallback file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Document Metadata Form */}
          <div className="space-y-3 pt-1 border-t border-white/10">
            <label className="block text-[11px] uppercase tracking-wider font-bold text-blue-200/80">
              3. Certificate &amp; Compliance Details
            </label>

            {/* Document Title */}
            <div>
              <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                Document Title / Certificate Name *
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. SASSETA Firearm Training Certificate"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-hidden focus:border-blue-400"
              />
            </div>

            {/* Certificate Number & Issuing Authority in 2-col */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-blue-400" />
                  <span>Certificate / ID No.</span>
                </label>
                <input
                  type="text"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  placeholder="e.g. CERT-90214 or ID No"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-hidden focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-blue-400" />
                  <span>Issuing Body / School</span>
                </label>
                <input
                  type="text"
                  value={issuingAuthority}
                  onChange={(e) => setIssuingAuthority(e.target.value)}
                  placeholder="e.g. SASSETA / PSIRA"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-hidden focus:border-blue-400"
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Expiration Date</span>
                </span>
                <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hasExpiry}
                    onChange={(e) => setHasExpiry(!e.target.checked)}
                    className="rounded text-blue-500"
                  />
                  <span>No Expiration (Lifetime)</span>
                </label>
              </div>

              {hasExpiry && (
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white text-xs focus:outline-hidden focus:border-blue-400"
                />
              )}
            </div>

            {/* Officer & Storage Badge */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 grid place-items-center font-bold text-xs">
                  {officer?.name?.charAt(0) || 'O'}
                </div>
                <div>
                  <div className="font-semibold text-white text-[11px]">
                    {officer?.name || 'Tshepo Maloa'}
                  </div>
                  <div className="text-[10px] text-blue-200/70">
                    PSIRA No: 2490181 · EMP-0144
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold bg-blue-400/20 text-blue-300 px-2 py-0.5 rounded">
                  Cloud Firestore Vault
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#0B1E30]/80 flex-none flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveToFirestore}
            disabled={isSaving || !capturedImage}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              !capturedImage
                ? 'bg-blue-600/40 text-blue-200/50 cursor-not-allowed border border-white/5'
                : isSaving
                ? 'bg-blue-700 text-white cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Storing in Cloud Firestore...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Store in Firestore Database</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
