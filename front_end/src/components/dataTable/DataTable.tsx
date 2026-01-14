import styles from "./DataTable.module.css";
import { useEffect, useState } from "react";
import { FaPen } from "react-icons/fa";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";

interface Column {
  key: string;
  label: string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  title?: string;
  apiEndpoint?: string;
  renderModalContent?: (opts: {
    apiEndpoint?: string;
    closeModal: () => void;
  }) => React.ReactNode;
  idKey?: string;
  pageSize?: number;
}

export default function DataTable({
  columns,
  data,
  title,
  apiEndpoint,
  renderModalContent,
  idKey = "id",
  pageSize = 5, 
}: DataTableProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<any | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    setIsLoggedIn(!!token);
    setRole(storedRole);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  /* ===== 페이지네이션 계산 ===== */
  const totalPages =
    data.length === 0 ? 1 : Math.ceil(data.length / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleDelete = async (row: Record<string, any>) => {
    if (!apiEndpoint) return;
    if (!isLoggedIn || role !== "admin") {
      alert("삭제 권한이 없습니다.");
      return;
    }

    const id = row[idKey];
    if (id == null) {
      alert("삭제할 ID가 없습니다.");
      return;
    }

    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      setDeletingId(id);

      const res = await fetch(`${apiEndpoint}/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("삭제 실패");

      alert("삭제되었습니다.");
    } catch (err: any) {
      alert(err.message || "삭제 중 오류 발생");
    } finally {
      setDeletingId(null);
    }
  };

  const showDeleteColumn = isLoggedIn && role === "admin" && apiEndpoint;

  return (
    <div className={styles.wrapper}>
      {title && (
        <div className={styles.headerRow}>
          <h2 className={styles.title}>{title}</h2>

          {isLoggedIn && role === "admin" && renderModalContent && (
            <button
              type="button"
              className={styles.writeBtn}
              onClick={openModal}
            >
              <FaPen />
            </button>
          )}
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {showDeleteColumn && <th>삭제</th>}
          </tr>
        </thead>

        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, idx) => (
              <tr key={row[idKey] ?? idx}>
                {columns.map((col) => (
                  <td key={col.key}>{row[col.key] ?? "-"}</td>
                ))}
                {showDeleteColumn && (
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(row)}
                      disabled={deletingId === row[idKey]}
                    >
                      {deletingId === row[idKey] ? "삭제 중..." : "삭제"}
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + (showDeleteColumn ? 1 : 0)}
                className={styles.empty}
              >
                등록된 데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ===== 페이지네이션 ===== */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <FaAnglesLeft />
          </button>

          {Array.from({ length: totalPages }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={page === currentPage ? styles.active : ""}
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
          >
            <FaAnglesRight />
          </button>
        </div>
      )}

      {isModalOpen && renderModalContent && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            {renderModalContent({ apiEndpoint, closeModal })}
          </div>
        </div>
      )}
    </div>
  );
}
