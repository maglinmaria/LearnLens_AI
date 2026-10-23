"use client";

import React from "react";

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export default function ImageUpload({ onFileSelect, selectedFile }: ImageUploadProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      alert("Please upload a PNG, JPEG, WEBP, or GIF image.");
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const clear = () => {
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (selectedFile && preview) {
    return (
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          background: "var(--color-surface)",
        }}
        className="animate-fade-in"
      >
        <div style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Uploaded study material"
            style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }}
          />
          <button
            onClick={clear}
            id="remove-image-btn"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(0,0,0,0.7)",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: 28,
              height: 28,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
            }}
            aria-label="Remove image"
          >
            ×
          </button>
        </div>
        <div style={{ padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`dropzone${dragOver ? " drag-over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{ padding: "var(--space-5)", cursor: "pointer" }}
      id="image-upload-dropzone"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      aria-label="Upload study material image"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
        id="image-file-input"
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
        <svg width="32" height="32" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          {dragOver ? "Drop image here" : "Drop image or click to upload"}
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", opacity: 0.7 }}>
          PNG, JPEG, WEBP, GIF
        </p>
      </div>
    </div>
  );
}
