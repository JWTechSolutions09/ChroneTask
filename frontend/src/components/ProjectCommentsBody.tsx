import React, { useCallback, useEffect, useRef, useState } from "react";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import Card from "./Card";
import Button from "./Button";

export type ProjectComment = {
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

export type CommentAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
};

type ProjectCommentsBodyProps = {
  organizationId?: string;
  projectId: string;
  enabled?: boolean;
  contentPadding?: string | number;
  composerPadding?: string | number;
};

export default function ProjectCommentsBody({
  organizationId,
  projectId,
  enabled = true,
  contentPadding = 20,
  composerPadding = 20,
}: ProjectCommentsBodyProps) {
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
    if (!enabled) return;
    setLoading(true);
    try {
      const endpoint = organizationId
        ? `/api/orgs/${organizationId}/projects/${projectId}/comments`
        : `/api/users/me/projects/${projectId}/comments`;
      const res = await http.get(endpoint);
      setComments(res.data || []);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando comentarios";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [enabled, organizationId, projectId, showToast]);

  useEffect(() => {
    if (enabled) {
      loadComments();
    }
  }, [enabled, loadComments]);

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
      const attachmentRequests = attachments.map((file) => ({
        fileName: file.name,
        fileUrl: "", // TODO: Upload file and get URL
        fileType: file.type.split("/")[0],
        fileSize: file.size,
      }));

      const endpoint = organizationId
        ? `/api/orgs/${organizationId}/projects/${projectId}/comments`
        : `/api/users/me/projects/${projectId}/comments`;

      await http.post(endpoint, {
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

  return (
    <>
      {/* Comments List */}
      <div style={{ flex: 1, overflowY: "auto", padding: contentPadding }}>
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
                      flexShrink: 0,
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{comment.userName}</span>
                      {comment.isPinned && <span style={{ fontSize: "12px", color: "#ffc107" }}>📌 Fijado</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{formatDate(comment.createdAt)}</div>
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
                          wordBreak: "break-word",
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
          padding: composerPadding,
          borderTop: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Pin + color (móvil-friendly) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "12px",
              width: "100%",
              maxWidth: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-primary)",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <label
              htmlFor="pin-comment"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                margin: 0,
                padding: 0,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <input
                type="checkbox"
                id="pin-comment"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                style={{ cursor: "pointer", margin: 0 }}
              />
              📌 Fijar
            </label>

            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                overflowX: "auto",
                paddingBottom: "2px",
                flex: "1 1 auto",
                minWidth: 0,
              }}
            >
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(selectedColor === color ? "" : color)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    backgroundColor: color,
                    border: selectedColor === color ? "3px solid var(--text-primary)" : "2px solid transparent",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  aria-label={`Color ${color}`}
                  title="Color"
                />
              ))}
            </div>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            style={{
              minHeight: "110px",
              padding: "12px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              fontSize: "14px",
              resize: "vertical",
              outline: "none",
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
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "var(--text-primary)", wordBreak: "break-word", flex: 1 }}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-secondary)",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                    aria-label="Quitar adjunto"
                    title="Quitar"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", width: "100%" }}>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: "none" }} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ flex: 1, minHeight: "44px" }}
            >
              📎 Adjuntar
            </Button>
            <Button type="submit" variant="primary" disabled={uploading} style={{ flex: 1, minHeight: "44px" }}>
              {uploading ? "Enviando..." : "Comentar"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

