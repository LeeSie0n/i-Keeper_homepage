import { useEffect, useRef, useState } from "react";
import styles from "./CommentSection.module.css";

interface Comment {
  id: number;
  content: string;
  date: string;
  author: string;
}

interface CommentSectionProps {
  postId: number;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [_content, setContent] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/posts/${postId}/comments`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) throw new Error("댓글 데이터를 불러올 수 없습니다.");

        const data = await res.json();

        const mapped: Comment[] = data.map((c: any) => ({
          id: c.id,
          content: (c.content || "").replace(/\n/g, "<br>"),
          date: new Date(c.createdAt).toLocaleString("ko-KR"),
          author:
            c.user?.name ||
            c.author?.name ||
            c.authorName ||
            c.author ||
            "익명",
        }));

        setComments(mapped);
      } catch (err) {
        console.error("댓글 불러오기 실패:", err);
      }
    }

    fetchComments();
  }, [postId]);

  const extractText = (el: HTMLDivElement | null) => {
    if (!el) return "";
    return el.innerHTML
      .replace(/<div>/g, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/div>/g, "")
      .replace(/&nbsp;/g, " ");
  };

  const handleInput = () => {
    setContent(extractText(contentRef.current));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = extractText(contentRef.current).trim();
    if (!text) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts/${postId}/comments`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content: text }),
        }
      );

      if (!res.ok) throw new Error("댓글 등록 실패");

      const data = await res.json();
      const newComment: Comment = {
        id: data.id,
        content: (data.content || "").replace(/\n/g, "<br>"),
        date: new Date(data.createdAt).toLocaleString("ko-KR"),
        author:
          data.user?.name ||
          data.author?.name ||
          data.authorName ||
          data.author ||
          "나",
      };

      setComments((prev) => [newComment, ...prev]);
      setContent("");
      if (contentRef.current) contentRef.current.innerHTML = "";
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts/${postId}/comments/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("댓글 삭제 실패");

      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      window.alert("삭제 권한 없음.");
    }
  };

  const handleEditStart = (id: number, oldContent: string) => {
    setEditingId(id);
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.innerHTML = oldContent;
      }
    }, 0);
  };

  const handleEditSave = async (id: number) => {
    const newText = extractText(editRef.current).trim().replace(/\n/g, "<br>");
    if (!newText) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts/${postId}/comments/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content: newText }),
        }
      );

      if (!res.ok) throw new Error("댓글 수정 실패");

      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, content: newText } : c))
      );
      setEditingId(null);
    } catch (err) {
      console.error("댓글 수정 오류:", err);
    }
  };

  return (
    <div className={styles.comments}>
      <h3>댓글 {comments.length}</h3>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputWrap}>
          <div
            ref={contentRef}
            className={styles.inputLike}
            contentEditable
            data-placeholder="댓글 입력"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
          ></div>
          <button type="submit" className={styles.submitBtn}>
            등록
          </button>
        </div>
      </form>

      <ul className={styles.list}>
        {comments.map((c) => (
          <li key={c.id} className={styles.item}>
            <div className={styles.meta}>
              <span>{c.author}</span> · <span>{c.date}</span>
            </div>

            {editingId === c.id ? (
              <div className={styles.editBox}>
                <div
                  ref={editRef}
                  className={styles.inputLike}
                  contentEditable
                  data-placeholder="댓글 수정 중..."
                ></div>
                <div className={styles.buttons}>
                  <button type="button" onClick={() => handleEditSave(c.id)}>
                    저장
                  </button>
                  <button type="button" onClick={() => setEditingId(null)}>
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p
                  className={styles.commentText}
                  dangerouslySetInnerHTML={{ __html: c.content }}
                />
                <div className={styles.actions}>
                  <button onClick={() => handleEditStart(c.id, c.content)}>
                    수정
                  </button>
                  <button onClick={() => handleDelete(c.id)}>삭제</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
