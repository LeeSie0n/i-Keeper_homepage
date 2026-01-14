import GalleryCard from "@/components/galleryCard/GalleryCard";
import { useEffect, useState } from "react";
import style from "./Gallery.module.css";
import { FaPen } from "react-icons/fa";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";

interface GalleryItem {
  id: number;
  imageUrl: string;
  title: string;
  writer: string;
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    setIsLoggedIn(!!token);
    setRole(storedRole);

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/files?purpose=gallery`, {
      credentials: "include",
      headers,
    })
      .then((res) => {
        if (!res.ok) throw new Error("서버 응답 실패");
        return res.json();
      })
      .then((result) => {
        const mapped: GalleryItem[] = result.files
          .filter((f: any) => f.mimetype.startsWith("image/"))
          .map((f: any) => ({
            id: f.id,
            imageUrl: `${import.meta.env.VITE_BACKEND_URL}/api/files/${f.id}/download`,
            title: f.title || "제목 없음",
            writer: f.uploader?.name || "알 수 없음",
          }));
        setItems(mapped);
        setCurrentPage(1);
      })
      .catch((err) => console.error("갤러리 데이터 불러오기 실패:", err));
  }, []);

  const totalPages =
    items.length === 0 ? 1 : Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUploadTitle("");
    setUploadFile(null);
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("이미지 파일을 선택해주세요.");
      return;
    }

    if (!uploadFile.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("purpose", "gallery");
      formData.append("title", uploadTitle);

      const res = await fetch(
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

      if (!res.ok) {
        let msg = "업로드 실패";
        try {
          const errBody = await res.json();
          console.error("upload error body:", errBody);
          if (errBody?.error) msg = errBody.error;
        } catch {
          const text = await res.text();
          console.error("upload error text:", text);
        }
        throw new Error(msg);
      }

      const newFile = await res.json();

      const newItem: GalleryItem = {
        id: newFile.id,
        imageUrl: `${import.meta.env.VITE_BACKEND_URL}/api/files/${newFile.id}/download`,
        title: uploadTitle || newFile.title || "제목 없음",
        writer: newFile.uploader?.name || "알 수 없음",
      };

      setItems((prev) => [newItem, ...prev]);
      setCurrentPage(1);
      closeModal();
    } catch (err) {
      console.error("갤러리 업로드 실패:", err);
      alert(
        err instanceof Error
          ? err.message || "업로드 중 오류가 발생했습니다."
          : "업로드 중 오류가 발생했습니다."
      );
      setUploading(false);
    }
  };

  const openDetail = (item: GalleryItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    if (deleting) return;
    setIsDetailOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (role !== "admin") {
      alert("삭제 권한이 없습니다.");
      return;
    }
    if (!window.confirm("이 이미지를 삭제하시겠습니까?")) return;

    try {
      setDeleting(true);
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/files/${selectedItem.id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("삭제에 실패했습니다.");
      }

      setItems((prev) => {
        const filtered = prev.filter((it) => it.id !== selectedItem.id);
        const newTotal = Math.max(
          1,
          Math.ceil(filtered.length / itemsPerPage)
        );
        if (currentPage > newTotal) {
          setCurrentPage(newTotal);
        }
        return filtered;
      });

      alert("삭제되었습니다.");
      setIsDetailOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error("갤러리 삭제 실패:", err);
      alert(
        err instanceof Error
          ? err.message || "삭제 중 오류가 발생했습니다."
          : "삭제 중 오류가 발생했습니다."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="site-container">
      <div className={style.headerRow}>
        <h2 className={style.subject}>Gallery</h2>
        {isLoggedIn && role === "admin" && (
          <button
            type="button"
            className={style.writeBtn}
            onClick={openModal}
            aria-label="갤러리 글쓰기"
          >
            <FaPen />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.length === 0 && (
          <div className={`col-span-full ${style.empty}`}>
            등록된 게시글이 없습니다.
          </div>
        )}

        {paginatedItems.map((item) => (
          <div
            key={item.id}
            className="cursor-pointer"
            onClick={() => openDetail(item)}
          >
            <GalleryCard
              imageUrl={item.imageUrl}
              title={item.title}
              writer={item.writer}
            />
          </div>
        ))}
      </div>

      {items.length > 0 && totalPages > 1 && (
        <div
          className={style.pagination}
          role="navigation"
          aria-label="pagination"
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="이전 페이지"
            className={style.pageBtn}
          >
            <FaAnglesLeft />
          </button>

          {Array.from({ length: totalPages }, (_, i) => {
            const page = i + 1;
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`${style.pageBtn} ${isActive ? style.activePage : ""
                  }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${page} 페이지로 이동`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={currentPage === totalPages}
            aria-label="다음 페이지"
            className={style.pageBtn}
          >
            <FaAnglesRight />
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className={style.modalOverlay} onClick={closeModal}>
          <div
            className={style.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={style.modalTitle}>갤러리 작성</h3>
            <form onSubmit={handleSubmit} className={style.modalForm}>
              <label className={style.modalLabel}>
                제목
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className={style.modalInput}
                  placeholder="이미지 제목을 입력하세요"
                />
              </label>

              <label className={style.modalLabel}>
                이미지 파일
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={style.modalInput}
                  required
                />
              </label>

              <div className={style.modalActions}>
                <button type="button" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" disabled={uploading}>
                  {uploading ? "업로드 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedItem && isDetailOpen && (
        <div className={style.modalOverlay} onClick={closeDetail}>
          <div
            className={style.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={style.modalTitle}>이미지 상세</h3>
            <div className={style.modalForm}>
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.title}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  objectFit: "cover",
                }}
              />
              <p>
                <strong>제목</strong>
                <br />
                {selectedItem.title}
              </p>
              <p>
                <strong>작성자</strong>
                <br />
                {selectedItem.writer}
              </p>
            </div>
            <div className={style.modalActions}>
              <button
                type="button"
                onClick={closeDetail}
                disabled={deleting}
              >
                닫기
              </button>
              {role === "admin" && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
