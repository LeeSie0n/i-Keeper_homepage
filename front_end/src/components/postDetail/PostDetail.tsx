import CommentSection from "@/components/commentSection/CommentSection";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../common/Loading";
import styles from "./PostDetail.module.css";

interface AttachmentFile {
  id: number;
  originalName?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number | null;
  authorName: string;
  categoryName: string;
  categoryId: number | null;
  createdAt: string;
  files: AttachmentFile[];
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role") || null;
    if (!token) return;

    async function fetchMe() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/me`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) {
          setCurrentUserRole(storedRole);
          return;
        }
        const me = await res.json();
        setCurrentUserId(me.id ?? null);
        setCurrentUserRole(me.role?.name || storedRole);
      } catch (err) {
        console.error("현재 유저 정보 불러오기 실패:", err);
        setCurrentUserRole(storedRole);
      }
    }

    fetchMe();
  }, []);

  const downloadFile = async (file: AttachmentFile) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/files/${file.id}/download`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("파일 다운로드 실패");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = file.originalName || "downloaded_file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("파일 다운로드 오류:", err);
      alert("파일 다운로드 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/posts/${id}`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );

        if (!res.ok) throw new Error("게시글을 불러올 수 없습니다.");

        const data = await res.json();
        const raw = data.post ?? data;

        const files: AttachmentFile[] = Array.isArray(raw.files)
          ? raw.files.map((f: any) => ({
              id: f.id,
              originalName:
                f.originalName || f.originalname || f.filename || undefined,
            }))
          : [];

        const mapped: Post = {
          id: raw.id,
          title: raw.title || "제목 없음",
          content: raw.content || "",
          authorId: raw.author?.id ?? null,
          authorName: raw.author?.name || "알 수 없음",
          categoryId: raw.category?.id ?? null,
          categoryName: raw.category?.name || "공지",
          createdAt: raw.createdAt
            ? new Date(raw.createdAt).toLocaleString("ko-KR")
            : "",
          files,
        };

        setPost(mapped);
      } catch (err: any) {
        console.error("게시글 불러오기 실패:", err);
        setError(err.message || "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  const canDelete =
    !!post &&
    (currentUserRole === "admin" ||
      (currentUserId != null && post.authorId != null && currentUserId === post.authorId));

  const handleDelete = async () => {
    if (!post) return;

    if (!canDelete) {
      alert("이 게시글을 삭제할 권한이 없습니다.");
      return;
    }

    if (!window.confirm("정말 이 게시글을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts/${post.id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("게시글 삭제에 실패했습니다.");
      }

      alert("게시글이 삭제되었습니다.");
      navigate(-1);
    } catch (err) {
      console.error("게시글 삭제 오류:", err);
      alert("게시글 삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <Loading />;
  if (error) return <p>오류 발생: {error}</p>;
  if (!post) return <Loading message="게시글을 찾을 수 없습니다." />;

  return (
    <section className={`site-container ${styles.detail}`}>
      <h2 className={styles.title}>{post.title}</h2>

      <div className={styles.meta}>
        <span>{post.categoryName}</span> · <span>{post.authorName}</span> ·{" "}
        <span>{post.createdAt}</span>
      </div>

      {post.files.length > 0 && (
        <div className={styles.fileWrap}>
          <p>첨부파일:</p>
          <ul className={styles.fileList}>
            {post.files.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  onClick={() => downloadFile(file)}
                  className={styles.fileLink}
                >
                  {file.originalName || "파일 다운로드"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.content}>
        {post.content.split("\n").map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>

      {post.categoryId !== 1 && <CommentSection postId={post.id} />}

      <div className={styles.actions}>
        <button type="button" onClick={() => navigate(-1)}>
          목록
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={styles.deleteBtn}
        >
          삭제
        </button>
      </div>
    </section>
  );
}
