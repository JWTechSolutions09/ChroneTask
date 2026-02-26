import React, { useState, useEffect, useCallback, useRef } from "react";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import Card from "./Card";
import Button from "./Button";

type ProjectComment = {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  isPinned: boolean;
  color?: string;
  createdAt: string;
  updatedAt?: string;
  attachments: CommentAttachment[];
};

type CommentAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
};

type ProjectCommentsPanelProps = {
  organizationId: string;
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function ProjectCommentsPanel({
  organizationId,
  projectId,
  projectName,
  isOpen,
  onClose,
}: ProjectCommentsPanelProps) {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const colors = ["#FFE5E5", "#E5F3FF", "#E5FFE5", "#FFF5E5", "#F0E5FF", "#E5FFFF"];

  const loadComments = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const res = await http.get(`/api/orgs/${organizationId}/projects/${projectId}/comments`);
      setComments(res.data || []);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando comentarios";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, isOpen, showToast]);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, loadComments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && attachments.length === 0) return;

    setUploading(true);
    try {
      // TODO: Upload files first to get URLs, then create comment with attachments
      // For now, we'll create comment without file upload implementation
      const attachmentRequests = attachments.map((file) => ({
        fileName: file.name,
        fileUrl: "", // TODO: Upload file and get URL
        fileType: file.type.split("/")[0],
        fileSize: file.size,
      }));

      await http.post(`/api/orgs/${organizationId}/projects/${projectId}/comments`, {
        content: newComment.trim(),
        isPinned,
        color: selectedColor || undefined,
        attachments: attachmentRequests.length > 0 ? attachmentRequests : undefined,
      });

      setNewComment("");
      setIsPinned(false);
      setSelectedColor("");
      setAttachments([]);
      await loadComments();
      showToast("Comentario creado exitosamente", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando comentario";
      showToast(errorMsg, "error");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "500px",
          maxWidth: "95vw",
          backgroundColor: "var(--bg-primary)",
          boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.15)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
              Comentarios del Proyecto
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            ×
          </button>
        </div>

        {/* Comments List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {loading ? (
            <div className="loading">Cargando comentarios...</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.3 }}>💬</div>
              <div>No hay comentarios aún</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {comments.map((comment) => (
                <Card
                  key={comment.id}
                  style={{
                    backgroundColor: comment.color || "var(--bg-secondary)",
                    borderLeft: comment.isPinned ? "4px solid #ffc107" : undefined,
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "var(--bg-tertiary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {comment.userAvatar ? (
                        <img
                          src={comment.userAvatar}
                          alt={comment.userName}
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        comment.userName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {comment.userName}
                        </span>
                        {comment.isPinned && (
                          <span style={{ fontSize: "12px", color: "#ffc107" }}>📌 Fijado</span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      color: "var(--text-primary)",
                      marginBottom: comment.attachments.length > 0 ? "12px" : 0,
                    }}
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                  />
                  {comment.attachments.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                      {comment.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px",
                            backgroundColor: "var(--bg-tertiary)",
                            borderRadius: "6px",
                            textDecoration: "none",
                            color: "var(--text-primary)",
                            fontSize: "14px",
                          }}
                        >
                          📎 {att.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* New Comment Form */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="checkbox"
                id="pin-comment"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <label htmlFor="pin-comment" style={{ fontSize: "14px", cursor: "pointer" }}>
                Fijar comentario
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(selectedColor === color ? "" : color)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    backgroundColor: color,
                    border: selectedColor === color ? "3px solid var(--text-primary)" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              style={{
                minHeight: "100px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontFamily: "inherit",
                fontSize: "14px",
                resize: "vertical",
              }}
            />
            {attachments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px",
                      backgroundColor: "var(--bg-tertiary)",
                      borderRadius: "6px",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                        fontSize: "18px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1 }}
              >
                📎 Adjuntar
              </Button>
              <Button type="submit" variant="primary" disabled={uploading} style={{ flex: 1 }}>
                {uploading ? "Enviando..." : "Comentar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
