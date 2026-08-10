import { useState, useRef } from "react";

/**
 * Client-side canvas compression function.
 * Resizes images to max 1600px and compresses to ~800KB jpeg blob.
 */
const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.82) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) return resolve(file);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function ImageUploader({ onImageSelected, existingPreview = "" }) {
  const [preview, setPreview] = useState(existingPreview);
  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressed);
      setPreview(previewUrl);
      if (onImageSelected) onImageSelected(compressed);
    } catch (e) {
      console.error("Compression error:", e);
    } finally {
      setCompressing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="image-uploader-container">
      <div
        className={`uploader-dropzone ${isDragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {preview ? (
          <div className="preview-box">
            <img src={preview} alt="Upload preview" />
            <div className="preview-overlay">
              <span>📷 Click or drop to change photo</span>
            </div>
          </div>
        ) : (
          <div className="dropzone-prompt">
            <div className="upload-icon">📸</div>
            <h4>Drag & drop item photo here</h4>
            <p>or click to browse your files (JPEG, PNG, WebP up to 10MB)</p>
            {compressing && <small className="compressing-text">Optimizing photo on device…</small>}
          </div>
        )}
      </div>
    </div>
  );
}
