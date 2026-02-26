import React, { useState, useEffect, useCallback, useRef } from "react";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import Card from "./Card";
import Button from "./Button";

type Task = {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority?: string;
  assignedToId?: string;
  assignedToName?: string;
  estimatedMinutes?: number;
  totalMinutes: number;
  dueDate?: string;
  tags?: string;
};

type TaskComment = {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  parentCommentId?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  replies: TaskComment[];
  attachments: CommentAttachment[];
  reactions: CommentReaction[];
};

type CommentAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
};

type CommentReaction = {
  id: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: string;
};

type TaskDetailModalProps = {
  task: Task;
  projectId: string;
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: () => void;
};

const REACTION_EMOJIS = ["👍", "❤️", "😄", "🎉", "🔥", "💯"];

export default function TaskDetailModal({
  task,
  projectId,
  organizationId,
  isOpen,
  onClose,
  onTaskUpdate,
}: TaskDetailModalProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const loadComments = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const res = await http.get(`/api/projects/${projectId}/tasks/${task.id}/comments`);
      setComments(res.data || []);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando comentarios";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [projectId, task.id, isOpen, showToast]);

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

  const handleSubmitComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!newComment.trim() && attachments.length === 0) return;

    try {
      const attachmentRequests = attachments.map((file) => ({
        fileName: file.name,
        fileUrl: "", // TODO: Upload file and get URL
        fileType: file.type.split("/")[0],
        fileSize: file.size,
      }));

      await http.post(`/api/projects/${projectId}/tasks/${task.id}/comments`, {
        content: newComment.trim(),
        parentCommentId: parentId || undefined,
        attachments: attachmentRequests.length > 0 ? attachmentRequests : undefined,
      });

      setNewComment("");
      setReplyingTo(null);
      setAttachments([]);
      await loadComments();
      showToast("Comentario creado exitosamente", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando comentario";
      showToast(errorMsg, "error");
    }
  };

  const handleAddReaction = async (commentId: string, emoji: string) => {
    try {
      await http.post(`/api/projects/${projectId}/tasks/${task.id}/comments/${commentId}/reactions`, emoji);
      await loadComments();
    } catch (ex: any) {
      showToast("Error agregando reacción", "error");
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

  const renderComment = (comment: TaskComment, level: number = 0) => {
    return (
      <div key={comment.id} style={{ marginLeft: level * 24, marginBottom: "16px" }}>
        <Card style={{ padding: "16px" }}>
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
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{comment.userName}</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {formatDate(comment.createdAt)}
              </div>
            </div>
          </div>
          <div
            style={{ color: "var(--text-primary)", marginBottom: "12px" }}
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
          {comment.attachments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {REACTION_EMOJIS.map((emoji) => {
              const reaction = comment.reactions.find((r) => r.emoji === emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(comment.id, emoji)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    backgroundColor: reaction ? "var(--bg-tertiary)" : "transparent",
                    border: "1px solid var(--border-color)",
                    borderRadius: "16px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  {emoji} {reaction && <span style={{ fontSize: "12px" }}>1</span>}
                </button>
              );
            })}
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              style={{
                padding: "4px 8px",
                backgroundColor: "transparent",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              Responder
            </button>
          </div>
          {replyingTo === comment.id && (
            <form
              onSubmit={(e) => {
                handleSubmitComment(e, comment.id);
                setReplyingTo(null);
              }}
              style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe una respuesta..."
                style={{
                  minHeight: "80px",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <Button type="submit" variant="primary" style={{ flex: 1 }}>
                  Responder
                </Button>
                <Button type="button" variant="secondary" onClick={() => setReplyingTo(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </Card>
        {comment.replies.map((reply) => renderComment(reply, level + 1))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <Card
        style={{
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              {task.title}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
              {task.type} • {task.status}
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

        {task.description && (
          <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
              Descripción
            </h3>
            <p style={{ margin: 0, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{task.description}</p>
          </div>
        )}

        {/* Comments Section */}
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "24px", marginTop: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 16px 0", color: "var(--text-primary)" }}>
            Comentarios ({comments.length})
          </h3>

          {loading ? (
            <div className="loading">Cargando comentarios...</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.3 }}>💬</div>
              <div>No hay comentarios aún</div>
            </div>
          ) : (
            <div style={{ marginBottom: "24px" }}>{comments.map((comment) => renderComment(comment))}</div>
          )}

          {/* New Comment Form */}
          <form onSubmit={(e) => handleSubmitComment(e)} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
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
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} style={{ flex: 1 }}>
                📎 Adjuntar
              </Button>
              <Button type="submit" variant="primary" style={{ flex: 1 }}>
                Comentar
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
