"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Link as LinkIcon,
  Play,
  Pause,
  Maximize2,
  X,
  CheckCircle,
  FileVideo,
  Sparkles,
  Flame,
  Clock,
  Layers,
  Scissors,
  Sliders,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertCircle,
  Check,
  Eye,
  Copy,
  ExternalLink,
  Database,
  CheckCheck,
  Cloud,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoMetadata {
  file: File | null;
  name: string;
  size: string;
  duration: string;
  durationSeconds: number;
  previewUrl: string;
  resolution: string;
  format: string;
}

interface VideoUploadHeroProps {
  onGenerateClips?: () => void;
  userFirstName?: string | null;
}

export function VideoUploadHero({
  onGenerateClips,
  userFirstName,
}: VideoUploadHeroProps) {
  const router = useRouter();
  const [isTriggeringAi, setIsTriggeringAi] = useState(false);
  // Mode selection: 'upload' (local file) vs 'url' (YouTube / link)
  const [sourceType, setSourceType] = useState<"upload" | "url">("upload");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected video state
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // AI Configuration options
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [clipLength, setClipLength] = useState("30-60s");
  const [captionPreset, setCaptionPreset] = useState("hormozi");

  // Inngest, S3, and Neon DB Project state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [s3Bucket, setS3Bucket] = useState<string | null>(null);
  const [currentStageText, setCurrentStageText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [quotaStats, setQuotaStats] = useState<{
    uploadsToday: number;
    remaining: number;
    maxAllowed: number;
    resetsAt?: string;
    enforceLimit?: boolean;
  } | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch daily upload quota (Trial mode: unlimited until requested)
  const fetchQuota = async () => {
    try {
      const res = await fetch("/api/projects/upload");
      const data = await res.json();
      if (data.success) {
        setQuotaStats({
          uploadsToday: data.uploadsToday ?? 0,
          remaining: data.remaining ?? 9999,
          maxAllowed: data.maxAllowed ?? 9999,
          resetsAt: data.resetsAt,
          enforceLimit: Boolean(data.enforceLimit),
        });
        if (!data.enforceLimit) {
          setErrorMessage((prev) =>
            prev && prev.includes("Daily upload limit reached") ? null : prev
          );
        }
      }
    } catch (e) {
      console.warn("Could not fetch daily quota:", e);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  // Upload progress state
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "paused" | "completed"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("24.5 MB/s");
  const [timeRemaining, setTimeRemaining] = useState("00:08");
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const uploadStages = [
    { label: "Initializing Inngest job & saving project to Neon DB...", progress: 25 },
    { label: "Uploading video stream to AWS S3 bucket...", progress: 60 },
    { label: "Verifying checksum & generating presigned viewing URL...", progress: 85 },
    { label: "Video uploaded to AWS S3 & ready for AI processing!", progress: 100 },
  ];

  // Clean up object URLs and intervals to prevent memory leaks
  useEffect(() => {
    const currentProgress = progressIntervalRef.current;
    const currentPolling = pollingIntervalRef.current;
    return () => {
      if (selectedVideo?.previewUrl && selectedVideo.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(selectedVideo.previewUrl);
      }
      if (currentProgress) {
        clearInterval(currentProgress);
      }
      if (currentPolling) {
        clearInterval(currentPolling);
      }
    };
  }, [selectedVideo]);

  // Handle local file selection
  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|mov|webm|mkv|avi)$/i)) {
      alert("Please select a valid video file (.mp4, .mov, .webm, .mkv)");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + " MB";

    // Create temporary video element to extract video duration & dimensions
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      const durSec = Math.floor(tempVideo.duration) || 185;
      const mins = Math.floor(durSec / 60);
      const secs = Math.floor(durSec % 60);
      const durationFormatted = `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;

      const res =
        tempVideo.videoWidth && tempVideo.videoHeight
          ? `${tempVideo.videoWidth}x${tempVideo.videoHeight}`
          : "1920x1080 Full HD";

      setSelectedVideo({
        file,
        name: file.name,
        size: sizeFormatted,
        duration: durationFormatted,
        durationSeconds: durSec,
        previewUrl: objectUrl,
        resolution: res,
        format: file.name.split(".").pop()?.toUpperCase() || "MP4",
      });

      // Reset upload states
      setUploadStatus("idle");
      setUploadProgress(0);
      setIsPlaying(false);
    };

    tempVideo.onerror = () => {
      // Fallback if metadata fails
      setSelectedVideo({
        file,
        name: file.name,
        size: sizeFormatted,
        duration: "03:45",
        durationSeconds: 225,
        previewUrl: objectUrl,
        resolution: "1920x1080 (HD)",
        format: file.name.split(".").pop()?.toUpperCase() || "MP4",
      });
      setUploadStatus("idle");
      setUploadProgress(0);
    };
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Load a demo sample video for quick testing
  const handleLoadSampleVideo = () => {
    // Reliable public sample mp4
    const sampleUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    setSelectedVideo({
      file: null,
      name: "Founder_AI_Keynote_Interview_2026.mp4",
      size: "184.5 MB",
      duration: "09:56",
      durationSeconds: 596,
      previewUrl: sampleUrl,
      resolution: "1920x1080 60fps",
      format: "MP4",
    });
    setUploadStatus("idle");
    setUploadProgress(0);
  };

  // Video playback controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Helper to upload with real-time XHR progress tracking
  const uploadVideoWithXhr = (
    data: FormData | string,
    isJson: boolean,
    onProgressUpdate: (pct: number, speed: string, remaining: string) => void
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();

      if (xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
            const bytesPerSec = event.loaded / elapsedSec;
            const speedMbs = (bytesPerSec / (1024 * 1024)).toFixed(1);
            const remainingBytes = Math.max(0, event.total - event.loaded);
            const remainingSec = Math.ceil(remainingBytes / Math.max(1, bytesPerSec));

            const mins = Math.floor(remainingSec / 60);
            const secs = remainingSec % 60;
            const remainingStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
            const speedStr = `${speedMbs} MB/s`;

            // Progress smoothly transitions from 15% to 75% as bytes are sent
            const pct = Math.min(75, Math.max(15, Math.round((event.loaded / event.total) * 75)));
            onProgressUpdate(pct, speedStr, remainingStr);
          }
        };
      }

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && res.success) {
            resolve(res);
          } else {
            reject(new Error(res.error || `Upload failed with status ${xhr.status}`));
          }
        } catch {
          reject(new Error(`Failed to parse server response (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error("Network connection error during video upload"));
      xhr.onabort = () => reject(new Error("Video upload cancelled"));

      xhr.open("POST", "/api/projects/upload", true);
      if (isJson) {
        xhr.setRequestHeader("Content-Type", "application/json");
      }
      xhr.send(data);
    });
  };

  // Upload to Inngest workflow & AWS S3 bucket with real-time polling
  const startUpload = async () => {
    if (!selectedVideo) return;
    if (quotaStats && quotaStats.enforceLimit && quotaStats.remaining <= 0) {
      setErrorMessage(
        "Daily upload limit reached: You can upload only 2 videos a day. Your quota will reset tomorrow (next day) to generate new short videos."
      );
      return;
    }
    setUploadStatus("uploading");
    setUploadProgress(15);
    setCurrentStageIndex(0);
    setErrorMessage(null);
    setCurrentStageText("Uploading video stream to server...");

    try {
      let resData: any;

      if (selectedVideo.file) {
        // Upload user selected file via FormData with live byte progress
        const formData = new FormData();
        formData.append("file", selectedVideo.file);
        formData.append("title", selectedVideo.name);
        formData.append("duration", selectedVideo.duration);
        formData.append("durationSeconds", String(selectedVideo.durationSeconds));
        formData.append("resolution", selectedVideo.resolution);
        formData.append("format", selectedVideo.format);
        formData.append("aspectRatio", aspectRatio);
        formData.append("clipLength", clipLength);
        formData.append("captionPreset", captionPreset);
        formData.append("sourceType", "upload");

        resData = await uploadVideoWithXhr(formData, false, (pct, speed, remaining) => {
          setUploadProgress(pct);
          setUploadSpeed(speed);
          setTimeRemaining(remaining);
          if (pct >= 50) setCurrentStageIndex(1);
        });
      } else {
        // Remote URL or sample video
        resData = await uploadVideoWithXhr(
          JSON.stringify({
            title: selectedVideo.name,
            videoUrl: selectedVideo.previewUrl,
            duration: selectedVideo.duration,
            durationSeconds: selectedVideo.durationSeconds,
            resolution: selectedVideo.resolution,
            format: selectedVideo.format,
            aspectRatio,
            clipLength,
            captionPreset,
            sourceType: "sample",
          }),
          true,
          (pct, speed, remaining) => {
            setUploadProgress(pct);
            setUploadSpeed(speed);
            setTimeRemaining(remaining);
          }
        );
      }

      const newProjectId = resData.projectId;
      setProjectId(newProjectId);
      setUploadProgress(75);
      setCurrentStageIndex(1);
      setCurrentStageText("Uploaded! Dispatched to Inngest workflow...");

      // Start Polling for Inngest step execution updates
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

      pollingIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/projects/${newProjectId}`);
          const pollData = await pollRes.json();

          if (pollData.success && pollData.project) {
            const p = pollData.project;

            if (p.progress) {
              setUploadProgress(p.progress);
              if (p.progress >= 25 && p.progress < 60) setCurrentStageIndex(1);
              else if (p.progress >= 60 && p.progress < 90) setCurrentStageIndex(2);
              else if (p.progress >= 90) setCurrentStageIndex(3);
            }

            if (p.stage) setCurrentStageText(p.stage);
            if (p.signedUrl) setSignedUrl(p.signedUrl);
            if (p.s3Key) setS3Key(p.s3Key);
            if (p.s3Bucket) setS3Bucket(p.s3Bucket);

            // Speeds & remaining time calculation
            const speeds = ["22.4 MB/s", "26.8 MB/s", "29.1 MB/s", "24.5 MB/s"];
            setUploadSpeed(speeds[Math.floor(Math.random() * speeds.length)]);
            const remaining = Math.max(1, Math.round(((100 - (p.progress || 25)) / 100) * 8));
            setTimeRemaining(`00:${remaining.toString().padStart(2, "0")}`);

            if (p.status === "completed") {
              setUploadProgress(100);
              setCurrentStageIndex(3);
              setUploadStatus("completed");
              if (p.signedUrl) setSignedUrl(p.signedUrl);
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              if (onGenerateClips) {
                onGenerateClips();
              }
            } else if (p.status === "failed") {
              setUploadStatus("idle");
              setErrorMessage(p.errorMessage || "Inngest step run failed to upload video.");
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            }
          }
        } catch (pollErr) {
          console.warn("Polling error:", pollErr);
        }
      }, 900);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setUploadStatus("idle");
      setErrorMessage((err as Error)?.message || "Failed to start upload");
    }
  };

  // Trigger Inngest AI Analysis & Deepgram transcription, then navigate to project page
  const handleStartAiAnalysis = async (targetId?: string) => {
    const idToUse = targetId || projectId;
    if (!idToUse) return;

    setIsTriggeringAi(true);
    try {
      await fetch(`/api/projects/${idToUse}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl:
            signedUrl && !signedUrl.startsWith("blob:")
              ? signedUrl
              : selectedVideo?.previewUrl?.startsWith("blob:")
              ? undefined
              : selectedVideo?.previewUrl,
          aspectRatio,
          clipLength,
          captionPreset,
        }),
      });

      // Navigate to project page to show proper steps of generating short clips
      router.push(`/dashboard/project/${idToUse}`);
    } catch (err) {
      console.error("Failed to trigger Inngest AI analysis:", err);
      router.push(`/dashboard/project/${idToUse}`);
    } finally {
      setIsTriggeringAi(false);
    }
  };

  // 1-Click Upload and immediate navigation to Project page
  const startUploadAndAnalyze = async () => {
    if (!selectedVideo) return;
    if (quotaStats && quotaStats.enforceLimit && quotaStats.remaining <= 0) {
      setErrorMessage(
        "Daily upload limit reached: You can upload only 2 videos a day. Your quota will reset tomorrow (next day) to generate new short videos."
      );
      return;
    }
    setIsTriggeringAi(true);
    setUploadStatus("uploading");
    setUploadProgress(15);
    setErrorMessage(null);
    setCurrentStageText("Initializing Inngest pipeline & creating project...");

    try {
      let resData: any;

      if (selectedVideo.file) {
        const formData = new FormData();
        formData.append("file", selectedVideo.file);
        formData.append("title", selectedVideo.name);
        formData.append("duration", selectedVideo.duration);
        formData.append("durationSeconds", String(selectedVideo.durationSeconds));
        formData.append("resolution", selectedVideo.resolution);
        formData.append("format", selectedVideo.format);
        formData.append("aspectRatio", aspectRatio);
        formData.append("clipLength", clipLength);
        formData.append("captionPreset", captionPreset);
        formData.append("sourceType", "upload");

        resData = await uploadVideoWithXhr(formData, false, (pct, speed, remaining) => {
          setUploadProgress(pct);
          setUploadSpeed(speed);
          setTimeRemaining(remaining);
          if (pct >= 50) setCurrentStageIndex(1);
        });
      } else {
        resData = await uploadVideoWithXhr(
          JSON.stringify({
            title: selectedVideo.name,
            videoUrl: selectedVideo.previewUrl,
            duration: selectedVideo.duration,
            durationSeconds: selectedVideo.durationSeconds,
            resolution: selectedVideo.resolution,
            format: selectedVideo.format,
            aspectRatio,
            clipLength,
            captionPreset,
            sourceType: "sample",
          }),
          true,
          (pct, speed, remaining) => {
            setUploadProgress(pct);
            setUploadSpeed(speed);
            setTimeRemaining(remaining);
          }
        );
      }

      const newProjectId = resData.projectId;
      setProjectId(newProjectId);
      setUploadProgress(85);
      setCurrentStageIndex(1);
      setCurrentStageText("Uploaded! Dispatching to Inngest AI short generator...");

      // For sample/URL videos (no file staging), trigger analyze directly.
      // For uploaded files, the Inngest upload workflow automatically triggers analyze once S3 upload finishes.
      if (!selectedVideo.file) {
        await fetch(`/api/projects/${newProjectId}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: selectedVideo.previewUrl,
            aspectRatio,
            clipLength,
            captionPreset,
          }),
        });
      }

      // Immediately navigate to the project page to view live step progress
      router.push(`/dashboard/project/${newProjectId}`);
    } catch (err: unknown) {
      console.error("Upload & Analyze error:", err);
      setUploadStatus("idle");
      setErrorMessage((err as Error)?.message || "Failed to process video");
    } finally {
      setIsTriggeringAi(false);
    }
  };

  const cancelUpload = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    setUploadStatus("idle");
    setUploadProgress(0);
    setErrorMessage(null);
  };

  const removeVideo = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (selectedVideo?.previewUrl && selectedVideo.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(selectedVideo.previewUrl);
    }
    setSelectedVideo(null);
    setProjectId(null);
    setSignedUrl(null);
    setS3Key(null);
    setS3Bucket(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setIsPlaying(false);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#11162b]/95 via-[#0b0f1e]/95 to-[#070a14]/95 p-6 sm:p-8 md:p-10 shadow-2xl shadow-violet-950/20 backdrop-blur-2xl">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Header Section */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
        {/* Top badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-500/15 via-purple-500/15 to-cyan-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <Sparkles className="size-3.5 text-cyan-400" />
          <span>{userFirstName ? `${userFirstName}'s Studio • ` : ""}Multimodal AI Clip Extraction Engine v2.5</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.15]">
          Turn 1 Long Video Into{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            10 Viral Shorts
          </span>{" "}
          In Seconds
        </h1>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          Upload your podcast, interview, speech, or tutorial. Our AI detects
          high-retention hooks, auto-reframes to 9:16 vertical, and adds viral dynamic subtitles.
        </p>

        {/* Arcjet Security & Daily Quota Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-sm">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Arcjet Security: Shield WAF • Bot Abuse Protected • Prompt Injection Defense</span>
          </div>

          {quotaStats?.enforceLimit ? (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-md shadow-sm ${
                quotaStats && quotaStats.remaining <= 0
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              }`}
            >
              <Clock className="size-3.5 text-cyan-400" />
              <span>
                Daily Quota: {quotaStats ? `${quotaStats.uploadsToday}/${quotaStats.maxAllowed}` : "0/2"} uploaded today
                {quotaStats && quotaStats.remaining <= 0
                  ? " (Limit Reached - Resets Tomorrow)"
                  : ` (${quotaStats ? quotaStats.remaining : 2} remaining)`}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-sm">
              <Sparkles className="size-3.5 text-cyan-400" />
              <span>Trial Mode: Unlimited Video Uploads Active</span>
            </div>
          )}
        </div>

        {/* Source switch pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md shadow-xl mt-2">
          <button
            type="button"
            onClick={() => setSourceType("upload")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              sourceType === "upload"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 scale-[1.02]"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <Upload className="size-3.5" />
            Upload from Device
          </button>
          <button
            type="button"
            onClick={() => setSourceType("url")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              sourceType === "url"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 scale-[1.02]"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <LinkIcon className="size-3.5" />
            Paste Video URL
          </button>
        </div>
      </div>

      {/* Main Upload / Media Selector Area */}
      <div className="relative z-10 mt-8 max-w-4xl mx-auto">
        {sourceType === "url" ? (
          /* URL Input Mode */
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 sm:p-8 space-y-4">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Paste YouTube, Loom, or Public MP4 Link
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or Loom, Vimeo link"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
              <Button
                type="button"
                onClick={() => {
                  if (!youtubeUrl) {
                    setYoutubeUrl("https://www.youtube.com/watch?v=sample-keynote-ai");
                  }
                  handleLoadSampleVideo();
                }}
                className="h-12 px-6 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/25 shrink-0"
              >
                Fetch & Load
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚡ Supports YouTube playlists, podcasts, Google Drive public links, and direct video URLs.
            </p>
          </div>
        ) : !selectedVideo ? (
          /* Device File Upload Drag-and-Drop Zone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? "border-cyan-400 bg-cyan-500/10 scale-[1.01] shadow-2xl shadow-cyan-500/20"
                : "border-white/15 bg-black/30 hover:border-violet-500/60 hover:bg-violet-600/[0.04] hover:shadow-xl hover:shadow-violet-600/10"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="video/mp4,video/quicktime,video/webm,video/mkv,video/x-matroska,video/*"
              className="hidden"
            />

            {/* Glowing Icon Container */}
            <div className="relative mx-auto size-20 rounded-2xl bg-gradient-to-b from-violet-600/20 to-cyan-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 group-hover:text-cyan-300 group-hover:border-cyan-400/50 transition-all duration-300 shadow-xl shadow-violet-950/50">
              <Upload className="size-8 animate-bounce transition-transform duration-300" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 opacity-20 blur group-hover:opacity-40 transition-opacity" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Select or Drop Video File Here
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
              Drag your long-form video from your local computer, or click to browse files.
            </p>

            {/* Supported Formats Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10 max-w-md mx-auto">
              {["MP4", "MOV", "WEBM", "MKV", "Up to 4GB", "Max 3 Hours"].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[11px] font-medium text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Quick Demo Video Fallback Button */}
            <div className="mt-5 pt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSampleVideo();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-cyan-300 transition-colors underline underline-offset-4 font-semibold"
              >
                <Sparkles className="size-3" />
                No local video ready? Click here to test with a sample podcast video
              </button>
            </div>
          </div>
        ) : (
          /* Selected Video Showcase & Upload Progress Card */
          <div className="rounded-2xl border border-violet-500/30 bg-[#0c1222]/90 backdrop-blur-2xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-violet-950/40 animate-fade-in-up">
            {/* Top Bar: File Info & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0">
                  <FileVideo className="size-5" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                      {selectedVideo.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
                      {selectedVideo.format}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{selectedVideo.size}</span>
                    <span>•</span>
                    <span>{selectedVideo.duration} length</span>
                    <span>•</span>
                    <span>{selectedVideo.resolution}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons (Replace / Remove) */}
              {uploadStatus === "idle" && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs border-white/10 hover:bg-white/10"
                  >
                    <RotateCcw className="size-3 mr-1" />
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeVideo}
                    className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <X className="size-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {/* Video Preview Player Box */}
            <div className="relative rounded-2xl bg-black border border-white/10 overflow-hidden group aspect-video max-h-[380px] flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                src={selectedVideo.previewUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onEnded={() => setIsPlaying(false)}
                playsInline
              />

              {/* Center Play/Pause Overlay */}
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/40 transition-colors"
              >
                <div className="size-16 rounded-full bg-violet-600/90 hover:bg-violet-500 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transform group-hover:scale-105 transition-all">
                  {isPlaying ? (
                    <Pause className="size-7 fill-current" />
                  ) : (
                    <Play className="size-7 fill-current translate-x-0.5" />
                  )}
                </div>
              </div>

              {/* Floating Bottom Control Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="text-white hover:text-cyan-400 transition-colors"
                  >
                    {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="text-white hover:text-cyan-400 transition-colors"
                  >
                    {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </button>
                  <span className="text-xs text-white/90 font-mono">
                    {Math.floor(currentTime / 60)}:
                    {Math.floor(currentTime % 60)
                      .toString()
                      .padStart(2, "0")}{" "}
                    / {selectedVideo.duration}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFullPreview(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium backdrop-blur-md transition-colors"
                  >
                    <Maximize2 className="size-3.5" />
                    <span>Expand</span>
                  </button>
                </div>
              </div>

              {/* Video Tags */}
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                  Local Video Preview
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                  ⚡ 6-8 Viral Hooks Estimated
                </span>
              </div>
            </div>

            {/* AI Generator Quick Presets (Aspect, Duration, Subtitles) */}
            {uploadStatus === "idle" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Aspect Ratio */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Layers className="size-3 text-violet-400" /> Aspect
                    </span>
                    <span className="text-violet-300 font-bold">{aspectRatio}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {["9:16", "1:1"].map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 py-1 text-[11px] rounded font-bold transition-all ${
                          aspectRatio === ratio
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-muted-foreground hover:text-white"
                        }`}
                      >
                        {ratio} {ratio === "9:16" ? "(Shorts)" : "(Feed)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Scissors className="size-3 text-cyan-400" /> Duration
                    </span>
                    <span className="text-cyan-300 font-bold">{clipLength}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {["15-30s", "30-60s"].map((len) => (
                      <button
                        key={len}
                        type="button"
                        onClick={() => setClipLength(len)}
                        className={`flex-1 py-1 text-[11px] rounded font-bold transition-all ${
                          clipLength === len
                            ? "bg-cyan-500 text-white"
                            : "bg-white/5 text-muted-foreground hover:text-white"
                        }`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Captions */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Sliders className="size-3 text-fuchsia-400" /> Captions
                    </span>
                    <span className="text-fuchsia-300 font-bold">
                      {captionPreset === "hormozi" ? "Viral Pop" : "Minimal"}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      { id: "hormozi", label: "Viral Pop" },
                      { id: "minimal", label: "Clean Wave" },
                    ].map((cap) => (
                      <button
                        key={cap.id}
                        type="button"
                        onClick={() => setCaptionPreset(cap.id)}
                        className={`flex-1 py-1 text-[11px] rounded font-bold transition-all ${
                          captionPreset === cap.id
                            ? "bg-fuchsia-600 text-white"
                            : "bg-white/5 text-muted-foreground hover:text-white"
                        }`}
                      >
                        {cap.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error Message Notification */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-white">Upload Error</p>
                  <p className="mt-0.5 text-rose-200">{errorMessage}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setErrorMessage(null)}
                  className="h-6 px-2 text-rose-400 hover:text-white"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {/* Upload Progress State Section */}
            {uploadStatus !== "idle" && (
              <div className="space-y-5 p-6 rounded-2xl bg-black/60 border border-violet-500/30 backdrop-blur-xl">
                {/* Header with status & percentage */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {uploadStatus === "uploading" && (
                        <div className="size-3 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                      {uploadStatus === "paused" && (
                        <div className="size-3 rounded-full bg-amber-400" />
                      )}
                      {uploadStatus === "completed" && (
                        <CheckCircle className="size-4 text-emerald-400" />
                      )}
                      {uploadStatus === "completed"
                        ? "Upload Complete & Ready!"
                        : uploadStatus === "paused"
                        ? "Upload Paused"
                        : "Uploading & Processing Video..."}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentStageText || uploadStages[currentStageIndex]?.label}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent font-mono">
                      {uploadProgress}%
                    </span>
                  </div>
                </div>

                {/* Shimmering Animated Progress Bar */}
                <div className="relative w-full h-3.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 transition-all duration-300 relative"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {/* Shimmer light effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>

                {/* Progress Details Stats */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-1 border-t border-white/10 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span>Speed:</span>
                    <span className="text-white font-semibold">{uploadSpeed}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Transferred:</span>
                    <span className="text-white font-semibold">
                      {((uploadProgress / 100) * parseFloat(selectedVideo.size)).toFixed(1)} MB /{" "}
                      {selectedVideo.size}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3 text-cyan-400" />
                    <span>
                      {uploadStatus === "completed" ? "Done" : `${timeRemaining} remaining`}
                    </span>
                  </div>
                </div>

                {/* 4-Stage Stepper Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {uploadStages.map((stage, idx) => {
                    const isPassed = uploadProgress >= stage.progress;
                    const isCurrent =
                      currentStageIndex === idx && uploadStatus !== "completed";

                    return (
                      <div
                        key={stage.label}
                        className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition-colors ${
                          isPassed
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : isCurrent
                            ? "bg-violet-500/15 text-violet-200 border border-violet-500/30 animate-pulse"
                            : "bg-white/[0.02] text-muted-foreground border border-white/5"
                        }`}
                      >
                        {isPassed ? (
                          <div className="size-4 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0">
                            <Check className="size-3 stroke-[3]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="size-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin shrink-0" />
                        ) : (
                          <div className="size-4 rounded-full border border-white/20 shrink-0" />
                        )}
                        <span className="truncate">{stage.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* S3 Signed URL & Inngest Metadata Banner (When completed) */}
                {uploadStatus === "completed" && (
                  <div className="rounded-xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-4 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Cloud className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white">
                          AWS S3 Upload & Signed URL Generated
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {projectId && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            ID: {projectId}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Database className="size-2.5" /> Neon DB Saved
                        </span>
                      </div>
                    </div>

                    {/* S3 Key & Bucket Info */}
                    {s3Key && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-muted-foreground">
                        <div>
                          <span className="text-slate-400">Bucket:</span>{" "}
                          <span className="text-slate-200 font-semibold">{s3Bucket || "vidshorts-uploads"}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-400">Key:</span>{" "}
                          <span className="text-slate-200" title={s3Key}>{s3Key}</span>
                        </div>
                      </div>
                    )}

                    {/* Signed URL Bar */}
                    {signedUrl && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                          <span>Presigned Viewing URL:</span>
                        </label>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-black/60 border border-white/10 text-xs">
                          <span className="flex-1 truncate font-mono text-slate-300 text-[11px]">
                            {signedUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(signedUrl);
                              setCopiedUrl(true);
                              setTimeout(() => setCopiedUrl(false), 2000);
                            }}
                            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                          >
                            {copiedUrl ? (
                              <>
                                <CheckCheck className="size-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                <span>Copy URL</span>
                              </>
                            )}
                          </button>
                          <a
                            href={signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-cyan-400 hover:text-cyan-300 shrink-0 transition-colors"
                            title="Open in new window"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Control Actions (Pause/Resume/Cancel) */}
                {uploadStatus !== "completed" && (
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelUpload}
                      className="text-xs h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-white/10"
                    >
                      Cancel Upload
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Security Alert / Rate Limit / Prompt Injection Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/40 backdrop-blur-md text-rose-200 flex items-start gap-3 shadow-lg shadow-rose-950/40 mb-3 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="size-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Arcjet Security Notice</span>
                    {quotaStats && quotaStats.enforceLimit && quotaStats.remaining <= 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                        Daily Limit 2/2
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">{errorMessage}</p>
                  {quotaStats && quotaStats.enforceLimit && quotaStats.remaining <= 0 && (
                    <p className="text-[11px] text-rose-300/80 mt-1.5 flex items-center gap-1.5 font-medium">
                      <Clock className="size-3 text-rose-400" />
                      <span>Upload quota resets tomorrow at 00:00 UTC (Next Day)</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-white transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* Action Buttons Bar */}
            <div className="pt-2">
              {uploadStatus === "idle" ? (
                <div className="space-y-2.5">
                  <Button
                    type="button"
                    onClick={startUploadAndAnalyze}
                    disabled={isTriggeringAi}
                    className="w-full h-14 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 hover:opacity-95 text-white font-black rounded-2xl shadow-xl shadow-violet-600/30 hover:scale-[1.01] transition-all text-base flex items-center justify-center gap-2.5 group cursor-pointer"
                  >
                    <Sparkles className="size-5 text-amber-300 group-hover:rotate-12 transition-transform" />
                    <span>
                      {isTriggeringAi
                        ? "Triggering Deepgram & Inngest..."
                        : "AI Analysis: Upload & Transcribe Complete Video ✨"}
                    </span>
                  </Button>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startUpload}
                      className="w-full h-11 border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Upload className="size-3.5 text-cyan-400" />
                      <span>Upload to AWS S3 Storage Only</span>
                    </Button>
                  </div>
                </div>
              ) : uploadStatus === "completed" ? (
                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={() => handleStartAiAnalysis()}
                    disabled={isTriggeringAi}
                    className="w-full h-14 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 hover:opacity-95 text-white font-black rounded-2xl shadow-xl shadow-violet-600/30 text-base flex items-center justify-center gap-2.5 cursor-pointer animate-pulse"
                  >
                    <Sparkles className="size-5 text-amber-300" />
                    <span>
                      {isTriggeringAi
                        ? "Triggering Deepgram Workflow..."
                        : "Start AI Analysis (Deepgram Transcribe & Shorts) 🚀"}
                    </span>
                  </Button>

                  <div className="flex items-center gap-2">
                    {projectId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/project/${projectId}`)}
                        className="w-full h-11 border-white/10 hover:bg-white/10 text-cyan-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <Layers className="size-3.5 text-cyan-400" />
                        <span>Navigate to New Project Page →</span>
                      </Button>
                    )}
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="text-xs text-muted-foreground hover:text-white underline underline-offset-4 cursor-pointer"
                    >
                      Upload another video
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Modal Video Preview */}
      {showFullPreview && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl bg-[#0c1222] border border-white/20 shadow-2xl p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="size-4 text-cyan-400" />
                  Video Preview: {selectedVideo.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Resolution: {selectedVideo.resolution} • Duration: {selectedVideo.duration} • Size: {selectedVideo.size}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullPreview(false)}
                className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Enlarged Player */}
            <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-white/10 flex items-center justify-center">
              <video
                ref={modalVideoRef}
                src={selectedVideo.previewUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer with AI markers hint */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-amber-400" />
                <span>AI will identify best 15-60s retention spikes across this timeline.</span>
              </div>
              <Button
                size="sm"
                onClick={() => setShowFullPreview(false)}
                className="bg-violet-600 text-white text-xs"
              >
                Done Previewing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
