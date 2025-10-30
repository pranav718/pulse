"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Tesseract from "tesseract.js";

interface ReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportUploadModal({
  isOpen,
  onClose,
}: ReportUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  const usage = useQuery(api.userUsage.getUsage);
  const checkUpload = useQuery(
    api.userUsage.canUploadReport,
    file ? { fileSizeMB: file.size / (1024 * 1024) } : "skip"
  );
  const saveReport = useMutation(api.reports.create);
  const incrementCount = useMutation(api.userUsage.incrementReportCount);
  const initUser = useMutation(api.userUsage.initializeUser);

  useEffect(() => {
    initUser();
  }, [initUser]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB per report.");
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const processReport = async () => {
    if (!file || (checkUpload && !checkUpload.allowed)) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      setProgress(10);
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(10 + Math.floor(m.progress * 40));
          }
        },
      });

      const text = result.data.text;
      setExtractedText(text);
      setProgress(50);

      const response = await fetch("/api/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const analysisData = await response.json();
      setAnalysis(analysisData);
      setProgress(80);

      await saveReport({
        reportText: text,
        summary: analysisData.summary,
        keyFindings: analysisData.keyFindings || [],
        fileName: file.name,
        fileSize: file.size,
      });

      await incrementCount({ 
        fileSizeMB: file.size / (1024 * 1024) 
      });
      setProgress(100);

      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);
    } catch (error) {
      console.error("Processing error:", error);
      alert("Failed to process report. Please try again.");
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview("");
    setIsProcessing(false);
    setProgress(0);
    setExtractedText("");
    setAnalysis(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-serif font-light">
                Upload Medical Report
              </h2>
              {usage && (
                <p className="text-sm text-gray-500 mt-1">
                  {usage.reportsUploaded} / {usage.reportsLimit} reports used this month
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {usage && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-serif text-blue-900">
                  Reports this month
                </span>
                <span className="text-sm font-medium text-blue-900">
                  {usage.reportsUploaded} / {usage.reportsLimit}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(usage.reportsUploaded / usage.reportsLimit) * 100}%` 
                  }}
                />
              </div>
              
              <div className="flex justify-between items-center mt-4 mb-2">
                <span className="text-sm font-serif text-blue-900">
                  Storage used
                </span>
                <span className="text-sm font-medium text-blue-900">
                  {usage.totalStorageMB.toFixed(1)} / {usage.storageLimit} MB
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(usage.totalStorageMB / usage.storageLimit) * 100}%` 
                  }}
                />
              </div>

              {usage.tier === "free" && (
                <p className="text-xs text-blue-700 mt-3">
                  💎 Upgrade to Premium for unlimited reports & storage
                </p>
              )}
            </div>
          )}

          {checkUpload && !checkUpload.allowed && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Cannot upload</p>
                <p className="text-xs text-red-700 mt-1">{checkUpload.reason}</p>
              </div>
            </div>
          )}

          {!file && !isProcessing && (
            <div className="border-2 border-dashed border-blue-200 rounded-2xl p-12 text-center">
              <div className="flex justify-center gap-4 mb-4">
                <ImageIcon className="w-12 h-12 text-blue-400" />
                <FileText className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-lg font-serif mb-2">
                Drop your report here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports: JPG, PNG (max 10MB)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="report-upload"
                disabled={checkUpload && !checkUpload.allowed}
              />
              <label
                htmlFor="report-upload"
                className={`px-6 py-3 ${
                  checkUpload && checkUpload.allowed
                    ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                } text-white rounded-full transition inline-block`}
              >
                Choose File
              </label>
            </div>
          )}

          {file && !isProcessing && (
            <div className="space-y-4">
              {preview && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain bg-gray-50"
                  />
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-serif text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={processReport}
                  disabled={checkUpload && !checkUpload.allowed}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze Report
                </button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-lg font-serif mb-2">
                {progress < 50
                  ? "Extracting text..."
                  : progress < 80
                  ? "Analyzing with AI..."
                  : progress < 100
                  ? "Saving report..."
                  : "Complete!"}
              </p>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 mt-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-blue-500 h-2 rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{progress}%</p>
            </div>
          )}

          {analysis && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-serif">Analysis Complete</span>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="font-serif font-medium mb-2">Summary</h3>
                <p className="text-sm text-gray-700">{analysis.summary}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-medium">Key Findings</h3>
                {analysis.keyFindings?.map((finding: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border ${
                      finding.category === "critical"
                        ? "bg-red-50 border-red-200"
                        : finding.category === "abnormal"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          finding.category === "critical"
                            ? "bg-red-200 text-red-900"
                            : finding.category === "abnormal"
                            ? "bg-yellow-200 text-yellow-900"
                            : "bg-green-200 text-green-900"
                        }`}
                      >
                        {finding.category}
                      </span>
                      {finding.severity && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                          {finding.severity}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      {finding.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}