"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Upload, FileText, Loader } from "lucide-react";

export default function ReportsPage() {
  const [userId] = useState("user-" + Math.random().toString(36).substr(2, 9));
  const [isUploading, setIsUploading] = useState(false);
  const [currentReport, setCurrentReport] = useState<{
    text: string;
    summary: string;
  } | null>(null);

  const reports = useQuery(api.reports.listReports, { user: userId }) || [];
  const saveReport = useMutation(api.reports.save);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      let text = "";

      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = async (event) => {
          text = event.target?.result as string;
          await processReport(text);
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = async (event) => {
          text = event.target?.result as string;
          await processReport(text);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
    }
  };

  const processReport = async (text: string) => {
    try {
      const response = await fetch("/api/explain-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportText: text }),
      });

      const data = await response.json();
      const summary = data.summary;

      await saveReport({
        user: userId,
        reportText: text.substring(0, 5000),
        summary,
      });

      setCurrentReport({ text, summary });
    } catch (error) {
      console.error("Process error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
          Medical Reports
        </h1>
        <p className="text-gray-600">Upload and get AI explanations of your reports</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-6">Upload Report</h2>

          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-500 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <Loader className="w-12 h-12 text-pink-500 animate-spin mb-4" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
              )}
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF or TXT files</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>

          {currentReport && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-pink-50 rounded-xl"
            >
              <h3 className="font-semibold text-pink-900 mb-2">AI Explanation:</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {currentReport.summary}
              </p>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-6">Report History</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No reports uploaded yet
              </p>
            ) : (
              reports.map((report, index) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {report.summary}
                      </p>
                      <button
                        onClick={() =>
                          setCurrentReport({
                            text: report.reportText,
                            summary: report.summary,
                          })
                        }
                        className="text-sm text-pink-600 hover:text-pink-700 font-medium mt-2"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}