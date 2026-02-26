import React, { useRef, useState } from "react";

type ImageUploadProps = {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
};

export default function ImageUpload({
  currentImageUrl,
  onImageChange,
  label = "Imagen",
  accept = "image/*",
  maxSizeMB = 5,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo es demasiado grande. Máximo ${maxSizeMB}MB`);
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Convertir a base64 para preview inmediato
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64String = reader.result as string;
          // Validar que el resultado sea válido
          if (!base64String || !base64String.startsWith("data:image/")) {
            setError("Formato de imagen no válido");
            setUploading(false);
            return;
          }
          setPreview(base64String);
          onImageChange(base64String);
          setUploading(false);
        } catch (err) {
          console.error("Error procesando imagen:", err);
          setError("Error al procesar la imagen");
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setError("Error al leer el archivo");
        setUploading(false);
      };
      reader.onabort = () => {
        setError("Lectura del archivo cancelada");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Error en handleFileSelect:", err);
      setError(err?.message || "Error al procesar la imagen");
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--text-primary)",
        }}
      >
        {label}
      </label>

      {preview ? (
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              position: "relative",
              display: "inline-block",
              borderRadius: "12px",
              overflow: "hidden",
              border: "2px solid var(--border-color)",
            }}
          >
            <img
              src={preview}
              alt="Preview"
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
                display: "block",
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                background: "rgba(220, 53, 69, 0.9)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(220, 53, 69, 1)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(220, 53, 69, 0.9)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              title="Remover imagen"
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            border: "2px dashed var(--border-color)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            backgroundColor: "var(--bg-secondary)",
            cursor: "pointer",
            transition: "all 0.2s",
            marginBottom: "12px",
          }}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.backgroundColor = "var(--hover-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📷</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "8px" }}>
            {uploading ? "Procesando..." : "Click para seleccionar imagen"}
          </div>
          <div style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
            PNG, JPG hasta {maxSizeMB}MB
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        disabled={uploading}
      />

      {!preview && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "10px 20px",
            backgroundColor: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: uploading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 500,
            transition: "all 0.2s",
            opacity: uploading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.currentTarget.style.backgroundColor = "var(--primary-dark)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.currentTarget.style.backgroundColor = "var(--primary)";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          {uploading ? "Subiendo..." : "Seleccionar Imagen"}
        </button>
      )}

      {error && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            backgroundColor: "rgba(220, 53, 69, 0.1)",
            border: "1px solid var(--danger)",
            borderRadius: "6px",
            color: "var(--danger)",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}

      <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px" }}>
        También puedes pegar una URL de imagen en el campo de texto
      </p>
    </div>
  );
}
