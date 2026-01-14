import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PostForm.module.css";

interface PostFormProps {
  categoryId: number;
  categoryName: string;
  basePath: string;
}

export default function PostForm({
  categoryId,
  categoryName,
  basePath,
}: PostFormProps) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedFileId: number | null = null;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", "document");

        const uploadRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/files/upload`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!uploadRes.ok) throw new Error("파일 업로드 실패");

        const uploadData = await uploadRes.json();
        uploadedFileId = uploadData.id;
      }

      const newPost = {
        title,
        content,
        categoryId,
        fileIds: uploadedFileId ? [uploadedFileId] : [],
      };

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          credentials: "include",
          body: JSON.stringify(newPost),
        }
      );
      if (!res.ok) throw new Error("게시글 등록 실패");

      alert("게시글이 저장되었습니다.");
      navigate(basePath);
    } catch (err) {
      console.error(err);
      alert("게시글 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`site-container ${styles.formWrap}`}>
      <h2 className={styles.title}>게시글 작성</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <label>카테고리</label>
          <input type="text" value={categoryName} readOnly />
        </div>

        <div className={styles.row}>
          <label>제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className={styles.row}>
          <label>내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
          />
        </div>

        <div className={styles.row}>
          <label>첨부파일</label>
          <input
            type="file"
            onChange={(e) =>
              setFile(e.target.files ? e.target.files[0] : null)
            }
            accept="*"
          />
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={loading}>
            {loading ? "저장 중..." : "저장"}
          </button>
          <button type="button" onClick={() => navigate(-1)}>
            취소
          </button>
        </div>
      </form>
    </section>
  );
}
