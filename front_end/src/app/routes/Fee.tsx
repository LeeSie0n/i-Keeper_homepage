import { useEffect, useState } from "react";
import DataTable from "@/components/dataTable/DataTable";
import styles from "@/components/dataTable/DataTable.module.css";

interface FeeRow {
  id: number;
  userName: string;
  amount: number;
  type: string;
  date: string;
  description: string;
}

function maskName(name: string) {
  if (!name || name === "알 수 없음") return name;

  const first = name[0];
  const restLength = name.length - 1;
  return first + "*".repeat(restLength);
}

export default function Fee() {
  const columns = [
    { key: "userName", label: "이름" },
    { key: "amount", label: "금액" },
    { key: "type", label: "유형" },
    { key: "date", label: "날짜" },
    { key: "description", label: "내역" },
  ];

  const [data, setData] = useState<FeeRow[]>([]);

  const apiEndpoint = `${import.meta.env.VITE_BACKEND_URL}/api/fees`;

  const fetchFees = async () => {
  try {
    const token = localStorage.getItem("token");
    const isLoggedIn = !!token;

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(apiEndpoint, {
      credentials: "include",
      headers,
    });
    if (!res.ok) throw new Error("서버 응답 오류");

    const result = await res.json();
    const list: any[] = result.fees || [];

    const mapped: FeeRow[] = list.map((f: any) => {
      const rawName: string = f.user?.name || "알 수 없음";

      return {
        id: f.id,
        userName: isLoggedIn ? rawName : maskName(rawName),
        amount: f.amount,
        type: f.type === "deposit" ? "입금" : "출금",
        date: new Date(f.date).toLocaleDateString("ko-KR"),
        description: f.description || "-",
      };
    });

    setData(mapped);
  } catch (err) {
    console.error("loading fail:", err);
    setData([]);
  }
};

  useEffect(() => {
    fetchFees();
  }, []);

  return (
    <DataTable
      columns={columns}
      data={data}
      title="Fee"
      apiEndpoint={apiEndpoint}
      renderModalContent={({ apiEndpoint, closeModal }) => (
        <FeeCreateForm
          apiEndpoint={apiEndpoint!}
          onSuccess={() => {
            closeModal();
            fetchFees();
          }}
          onCancel={closeModal}
        />
      )}
      pageSize={5}
    />
  );
}

interface FeeCreateFormProps {
  apiEndpoint: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FeeUser {
  id: number;
  name: string;
}

function FeeCreateForm({
  apiEndpoint,
  onSuccess,
  onCancel,
}: FeeCreateFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<FeeUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");

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

        const mapped: FeeUser[] = list.map((u: any) => ({
          id: u.id,
          name: u.name,
        }));

        setUsers(mapped);
      } catch (err) {
        console.error("회비용 회원 목록 조회 실패:", err);
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const amountStr = (fd.get("amount") as string)?.trim();
    const type = (fd.get("type") as string)?.trim() as "deposit" | "withdrawal";
    const dateStr = (fd.get("date") as string)?.trim();
    const description = (fd.get("description") as string)?.trim();

    if (!selectedUserId) {
      alert("대상을 선택해주세요.");
      return;
    }
    if (!amountStr || isNaN(Number(amountStr))) {
      alert("금액을 올바르게 입력해주세요.");
      return;
    }
    if (!type) {
      alert("유형(입금/출금)을 선택해주세요.");
      return;
    }
    if (!dateStr) {
      alert("날짜를 선택해주세요.");
      return;
    }

    const amount = Number(amountStr);
    const isoDate = new Date(`${dateStr}T00:00:00`).toISOString();

    try {
      setLoading(true);

      const body = {
        userId: Number(selectedUserId),
        amount,
        type, // "deposit" | "withdrawal"
        description: description || undefined,
        date: isoDate,
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

      if (!res.ok) throw new Error("회비 등록 실패");

      alert("회비 내역이 등록되었습니다.");
      onSuccess();
    } catch (err) {
      console.error("fee create error:", err);
      alert("회비 등록 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.modalForm}>
      <h3 className={styles.modalTitle}>회비 내역 등록</h3>

      <label className={styles.modalLabel}>
        대상 *
        <select
          value={selectedUserId}
          onChange={(e) =>
            setSelectedUserId(
              e.target.value ? Number(e.target.value) : ""
            )
          }
          className={styles.modalInput}
        >
          <option value="">선택하세요</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.modalLabel}>
        금액 *
        <input
          name="amount"
          type="number"
          min={0}
          className={styles.modalInput}
          required
        />
      </label>

      <label className={styles.modalLabel}>
        유형 *
        <select name="type" className={styles.modalInput} required>
          <option value="">선택하세요</option>
          <option value="deposit">입금</option>
          <option value="withdrawal">출금</option>
        </select>
      </label>

      <label className={styles.modalLabel}>
        날짜 *
        <input name="date" type="date" className={styles.modalInput} required />
      </label>

      <label className={styles.modalLabel}>
        내역
        <input
          name="description"
          type="text"
          placeholder="예) 회비 납부, 행사비 사용"
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
