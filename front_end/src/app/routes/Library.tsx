import DataTable from "@/components/dataTable/DataTable";
import { useEffect, useState } from "react";
import styles from "@/components/dataTable/DataTable.module.css";

interface BookRow {
  id: number;
  title: string;
  author: string;
  publisher: string;
  shelf?: string;
  dueDate?: string;
}

export default function Library() {
  const columns = [
    { key: "title", label: "책 제목" },
    { key: "author", label: "저자" },
    { key: "publisher", label: "출판사" },
    { key: "shelf", label: "책장 번호" },
    { key: "dueDate", label: "반납 예정일" },
  ];

  const [data, setData] = useState<BookRow[]>([]);

  const apiEndpoint = `${import.meta.env.VITE_BACKEND_URL}/api/books`;

  const fetchBooks = async () => {
    try {
      const res = await fetch(apiEndpoint, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("도서 목록 조회 실패");

      const result = await res.json();
      const list: any[] = Array.isArray(result)
        ? result
        : result.books || result.data || [];

      const mapped: BookRow[] = list.map((b: any) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        publisher: b.publisher,
        shelf: b.location ?? "-",
        dueDate: b.return_date
          ? new Date(b.return_date).toLocaleDateString("ko-KR")
          : "-",
      }));

      setData(mapped);
    } catch (err) {
      console.error("loading fail:", err);
      setData([]);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <DataTable
      columns={columns}
      data={data}
      title="Library"
      apiEndpoint={apiEndpoint}
      renderModalContent={({ apiEndpoint, closeModal }) => (
        <BookCreateForm
          apiEndpoint={apiEndpoint!}
          onSuccess={() => {
            closeModal();
            fetchBooks();
          }}
          onCancel={closeModal}
        />
      )}
      pageSize={5}
    />
  );
}

interface BookCreateFormProps {
  apiEndpoint: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function BookCreateForm({
  apiEndpoint,
  onSuccess,
  onCancel,
}: BookCreateFormProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const title = (fd.get("title") as string)?.trim();
    const author = (fd.get("author") as string)?.trim();
    const publisher = (fd.get("publisher") as string)?.trim();
    const shelf = (fd.get("shelf") as string)?.trim();

    if (!title || !author || !publisher) {
      alert("제목, 저자, 출판사는 필수입니다.");
      return;
    }

    try {
      setLoading(true);

      const body = {
        title,
        author,
        publisher,
        location: shelf || undefined, 
      };

      const res = await fetch(apiEndpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("도서 등록 실패");

      alert("도서가 등록되었습니다.");
      onSuccess();
    } catch (err) {
      console.error("book create error:", err);
      alert("도서 등록 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.modalForm}>
      <h3 className={styles.modalTitle}>도서 등록</h3>

      <label className={styles.modalLabel}>
        책 제목 *
        <input name="title" type="text" required className={styles.modalInput} />
      </label>

      <label className={styles.modalLabel}>
        저자 *
        <input name="author" type="text" required className={styles.modalInput} />
      </label>

      <label className={styles.modalLabel}>
        출판사 *
        <input
          name="publisher"
          type="text"
          required
          className={styles.modalInput}
        />
      </label>

      <label className={styles.modalLabel}>
        책장 번호
        <input
          name="shelf"
          type="text"
          placeholder="예) 3"
          className={styles.modalInput}
        />
      </label>

      <div className={styles.modalActions}>
        <button type="button" onClick={onCancel}>
          취소
        </button>
        <button type="submit" disabled={loading}>
          {loading ? "등록 중..." : "등록"}
        </button>
      </div>
    </form>
  );
}
