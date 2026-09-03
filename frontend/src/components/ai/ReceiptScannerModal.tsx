"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { ScanReceiptIcon, SparklesIcon } from "@/components/ui/Icons";
import { scanReceipt } from "@/lib/api/ai";
import { AIReceiptScanResponse } from "@/types";

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: AIReceiptScanResponse) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedImage(null);
    setIsScanning(false);
    setErrorMsg(null);
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (JPEG, PNG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 10MB limit.");
      return;
    }

    setMimeType(file.type);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleScan = async () => {
    if (!selectedImage || isScanning) return;
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const result = await scanReceipt({
        image_base64: selectedImage,
        mime_type: mimeType,
      });
      onScanComplete(result);
      resetState();
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Failed to scan receipt image. Please verify your AI API key in backend/.env."
      );
      setIsScanning(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isScanning) {
          resetState();
          onClose();
        }
      }}
      title="Scan Bill or Receipt with AI"
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload a receipt, restaurant bill, or payment screenshot. Multimodal AI will extract the merchant name, total amount, and date automatically.
        </p>

        {/* Upload Dropzone */}
        {!selectedImage ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ScanReceiptIcon size="lg" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Click to select or drag and drop
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Supports JPG, PNG, WebP up to 10MB
            </p>
          </div>
        ) : (
          /* Preview & Scanning state */
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
            {/* Image Preview */}
            <div className="relative h-60 w-full flex items-center justify-center bg-slate-950/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Receipt Preview"
                className="max-h-full max-w-full object-contain"
              />

              {/* Scanning Radar Animation */}
              {isScanning && (
                <div className="absolute inset-0 bg-primary-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center">
                  <motion.div
                    className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent shadow-[0_0_15px_#38bdf8]"
                    animate={{ top: ["5%", "95%", "5%"] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  />
                  <div className="z-10 bg-slate-900/90 border border-primary-500/30 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2.5">
                    <SparklesIcon size="md" className="text-primary-400 animate-spin" />
                    <span className="text-xs font-semibold text-white">
                      Analyzing receipt details...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Change image bar */}
            {!isScanning && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                  Image loaded successfully
                </span>
                <button
                  type="button"
                  onClick={resetState}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400"
                >
                  Remove & Choose Another
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between"
            >
              <span>{errorMsg}</span>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-slate-400 hover:text-slate-600 text-sm ml-2"
              >
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={isScanning}
            onClick={() => {
              resetState();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedImage || isScanning}
            onClick={handleScan}
            className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400 rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
          >
            {isScanning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <SparklesIcon size="sm" />
                <span>Extract Receipt ✨</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
