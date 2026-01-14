import { useEffect, useState } from "react";
import DataTable from "@/components/dataTable/DataTable";
import styles from "@/components/dataTable/DataTable.module.css";

interface CleaningRow {
  id: number;
  date: string;
  userName: string;
}

export default function Cleaning() {
  const columns = [
    { key: "date", label: "날짜" },
    { key: "userName", label: "이름" },
  ];

  const [data, setData] = useState<CleaningRow[]>([]);

  const apiEndpoint = `${import.meta.env.VITE_BACKEND_URL}/api/cleanings`;

  const fetchCleanings = async () => {
    try {
      const res = await fetch(apiEndpoint, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("서버 응답 오류");

      const result = await res.json();
      const list: any[] = result.cleanings || [];

      const mapped: CleaningRow[] = list.map((item: any) => ({
        id: item.id,
        date: new Date(item.date).toLocaleDateString("ko-KR"),
        userName:
          item.assignedUsers && item.assignedUsers.length > 0
            ? item.assignedUsers.map((u: any) => u.name).join(", ")
            : "배정 없음",
      }));

      setData(mapped);
    } catch (err) {
      console.error("loading fail:", err);
      setData([]);
    }
  };

  useEffect(() => {
    fetchCleanings();
  }, []);

  return (
    <DataTable
      columns={columns}
      data={data}
      title="Cleaning"
      apiEndpoint={apiEndpoint}
      renderModalContent={({ apiEndpoint, closeModal }) => (
        <CleaningCreateForm
          apiEndpoint={apiEndpoint!}
          onSuccess={() => {
            closeModal();
            fetchCleanings();
          }}
          onCancel={closeModal}
        />
      )}
      pageSize={5}
    />
  );
}

interface CleaningCreateFormProps {
  apiEndpoint: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface CleaningUser {
  id: number;
  name: string;
}

function CleaningCreateForm({
  apiEndpoint,
  onSuccess,
  onCancel,
}: CleaningCreateFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<CleaningUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const base = import.meta.env.VITE_BACKEND_URL;
        const res = await fetch(`${base}/api/admin/users`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error("회원 목록 조회 실패");

        const result = await res.json();
        const list: any[] = result.users || [];

        const mapped: CleaningUser[] = list.map((u: any) => ({
          id: u.id,
          name: u.name,
        }));

        setUsers(mapped);
      } catch (err) {
        console.error("청소 담당자용 회원 목록 조회 실패:", err);
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  const toggleUser = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const dateRaw = fd.get("date") as string | null;

    if (!dateRaw) {
      alert("날짜를 선택해주세요.");
      return;
    }
    if (selectedUserIds.length === 0) {
      alert("청소 담당자를 최소 1명 이상 선택해주세요.");
      return;
    }

    const dateStr = dateRaw.trim();
    const isoDate = new Date(`${dateStr}T00:00:00`).toISOString();

    try {
      setLoading(true);

      const body = {
        date: isoDate,
        assignedUserIds: selectedUserIds,
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

      if (!res.ok) {
        let msg = "청소 일정 등록 실패";
        try {
          const errBody = await res.json();
          console.error("cleaning create error body:", errBody);

          if (errBody?.message) {
            msg =
              Array.isArray(errBody.message) && errBody.message.length > 0
                ? errBody.message.join("\n")
                : errBody.message;
          } else if (errBody?.error) {
            msg = errBody.error;
          }
        } catch {
          const text = await res.text();
          console.error("cleaning create error text:", text);
        }
        throw new Error(msg);
      }

      alert("청소 일정이 등록되었습니다.");
      onSuccess();
    } catch (err) {
      console.error("cleaning create error:", err);
      alert(
        err instanceof Error
          ? err.message || "청소 일정 등록 중 오류가 발생했습니다."
          : "청소 일정 등록 중 오류가 발생했습니다."
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.modalForm}>
      <h3 className={styles.modalTitle}>청소 일정 등록</h3>

      <label className={styles.modalLabel}>
        날짜 *
        <input name="date" type="date" required className={styles.modalInput} />
      </label>

      <div className={styles.modalLabel}>
        담당자 선택 *
        <div
          style={{
            maxHeight: "160px",
            overflowY: "auto",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            padding: "0.4rem 0.6rem",
          }}
        >
          {users.length === 0 ? (
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              선택 가능한 회원이 없습니다.
            </div>
          ) : (
            users.map((u) => (
              <label
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.9rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(u.id)}
                  onChange={() => toggleUser(u.id)}
                />
                {u.name}
              </label>
            ))
          )}
        </div>
      </div>

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
