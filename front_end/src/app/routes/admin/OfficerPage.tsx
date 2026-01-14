import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./OfficerPage.module.css";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";

interface Member {
  id: number;
  name: string;
  studentId: string;
  major: string;
  email: string;
  role: string;
  roleId: number | null;
}

interface PendingMember {
  id: number;
  name: string;
  studentId: string;
  major: string;
  email: string;
  status: string;
}

export default function OfficerPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const MEMBERS_PER_PAGE = 10;
  const PENDING_PER_PAGE = 5;
  const [memberPage, setMemberPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const navigate = useNavigate();
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    studentId: "",
    major: "",
    email: "",
  });


  async function fetchData() {
    try {
      const token = localStorage.getItem("token");

      const commonOptions: RequestInit = {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [usersRes, pendingRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users`, commonOptions),
        fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/pending-users`,
          commonOptions
        ),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const usersArray: any[] = Array.isArray(usersData)
          ? usersData
          : usersData.users || usersData.data?.users || usersData.data || [];

        setMembers(
          usersArray.map((u: any) => ({
            id: u.id,
            name: u.name,
            studentId: u.studentId ?? "-",
            major: u.major ?? "-",
            email: u.email,
            role: u.role?.name || "member",
            roleId: u.role?.id ?? null,
          }))
        );
        setMemberPage(1);
      }

      if (pendingRes.ok) {
        const pendingArray: any[] = await pendingRes.json();
        setPendingMembers(
          pendingArray.map((u: any) => ({
            id: u.id,
            name: u.name,
            studentId: u.studentId,
            major: u.major,
            email: u.email,
            status: u.status ?? "pending_approval",
          }))
        );
        setPendingPage(1);
      }
    } catch (err) {
      console.error("임원진 페이지 데이터 로딩 실패:", err);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleToggle = async (id: number) => {
    if (!window.confirm("정말로 이 회원의 권한을 변경하시겠습니까?")) return;

    const target = members.find((m) => m.id === id);
    if (!target) return;

    const currentRoleName = target.role;
    const newRoleName = currentRoleName === "member" ? "admin" : "member";

    const newRoleId =
      members.find((m) => m.role === newRoleName)?.roleId ?? null;

    if (!newRoleId) {
      alert(`'${newRoleName}' 역할의 roleId를 찾을 수 없습니다.`);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ roleId: newRoleId }),
        }
      );

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("권한 변경 실패 response:", result);
        alert(result?.error || "권한 변경에 실패했습니다.");
        return;
      }

      alert(
        `${target.name}님의 권한이 ${
          newRoleName === "admin" ? "임원진" : "일반 회원"
        }으로 변경되었습니다.`
      );

      await fetchData();
    } catch (err) {
      console.error("권한 변경 실패:", err);
      alert("서버와의 통신 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("정말로 이 회원을 삭제하시겠습니까?")) return;

    const target = members.find((m) => m.id === id);
    if (!target) return;

    setMembers((prev) => prev.filter((m) => m.id !== id));

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!res.ok) throw new Error("삭제 실패");
    } catch (err) {
      console.error("회원 삭제 실패:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
      setMembers((prev) => [...prev, target]);
    }
  };

  const handlePendingDecision = async (id: number, approve: boolean) => {
    const message = approve
      ? "이 대기 회원을 승인하시겠습니까?"
      : "이 대기 회원을 거절하시겠습니까?";
    if (!window.confirm(message)) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${id}/approve`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ approve }),
        }
      );
      if (!res.ok) throw new Error("요청 실패");

      const result = await res.json();

      if (result === true) {
        alert("대기 회원이 승인되었습니다.");
      } else if (result === false) {
        alert("대기 회원이 거절되었습니다.");
      } else {
        alert("요청은 처리되었지만 서버 응답이 예상과 다릅니다.");
      }

      fetchData();
    } catch (err) {
      console.error("대기 회원 처리 실패:", err);
      alert("대기 회원 처리 중 오류가 발생했습니다.");
    }
  };

 const memberTotalPages = Math.max(
    1,
    Math.ceil(members.length / MEMBERS_PER_PAGE)
  );
  const pendingTotalPages = Math.max(
    1,
    Math.ceil(pendingMembers.length / PENDING_PER_PAGE)
  );

  useEffect(() => {
    if (memberPage > memberTotalPages) {
      setMemberPage(memberTotalPages);
    }
  }, [memberTotalPages]);

  useEffect(() => {
    if (pendingPage > pendingTotalPages) {
      setPendingPage(pendingTotalPages);
    }
  }, [pendingTotalPages]);

  const pagedMembers = members.slice(
    (memberPage - 1) * MEMBERS_PER_PAGE,
    memberPage * MEMBERS_PER_PAGE
  );

  const pagedPendingMembers = pendingMembers.slice(
    (pendingPage - 1) * PENDING_PER_PAGE,
    pendingPage * PENDING_PER_PAGE
  );

  function Pagination({
    page,
    total,
    setPage,
  }: {
    page: number;
    total: number;
    setPage: (p: number) => void;
  }) {
    if (total <= 1) return null;
    return (
      <div className={styles.pagination} role="navigation" aria-label="pagination">
        {/* 데스크톱 */}
        <div className={styles.desktopOnly}>
          <button onClick={() => setPage(1)} disabled={page === 1}>
            <MdKeyboardDoubleArrowLeft />
          </button>
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            <FaAnglesLeft />
          </button>

          {Array.from({ length: total }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={page === i + 1 ? styles.activePage : ""}
              aria-current={page === i + 1 ? "page" : undefined}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === total}
          >
            <FaAnglesRight />
          </button>
          <button onClick={() => setPage(total)} disabled={page === total}>
            <MdKeyboardDoubleArrowRight />
          </button>
        </div>

        {/* 모바일 */}
        <div className={styles.mobileOnly} aria-hidden="true">
          <button onClick={() => setPage(1)} disabled={page === 1}>
            <MdKeyboardDoubleArrowLeft />
          </button>
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            <FaAnglesLeft />
          </button>

          <span className={styles.pageInfo}>
            {page} / {total}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === total}
          >
            <FaAnglesRight />
          </button>
          <button onClick={() => setPage(total)} disabled={page === total}>
            <MdKeyboardDoubleArrowRight />
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className={`site-container ${styles.officerPage}`}>
      <div className={styles.actions}>
        <h2 className={styles.title}>임원진 페이지</h2>
        <button
          className={styles.noticeBtn}
          onClick={() => navigate("/notice/write")}
        >
          공지 작성
        </button>
      </div>

      <h3 className={styles.subTitle}>회원 관리</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>이름</th>
            <th>학번</th>
            <th>전공</th>
            <th>이메일</th>
            <th>권한</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {pagedMembers.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>
                등록된 회원이 없습니다.
              </td>
            </tr>
          ) : (
            pagedMembers.map((m) => (
              <tr key={m.id}>
                <td data-label="이름">{m.name}</td>
                <td data-label="학번">{m.studentId}</td>
                <td data-label="전공">{m.major}</td>
                <td data-label="이메일">{m.email}</td>
                <td data-label="권한">{m.role}</td>
                <td data-label="관리">
                  <button
                    className={styles.manageBtn}
                    onClick={() => {
                      setEditTarget(m);
                      setEditForm({
                        name: m.name,
                        studentId: m.studentId,
                        major: m.major,
                        email: m.email,
                      });
                      setIsEditOpen(true);
                    }}
                  >
                    회원정보 수정
                  </button>
                  <button
                    className={styles.manageBtn}
                    onClick={() => handleRoleToggle(m.id)}
                  >
                    권한변경
                  </button>
                  <button
                    className={styles.manageBtn}
                    onClick={() => handleDelete(m.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination
        page={memberPage}
        total={memberTotalPages}
        setPage={setMemberPage}
      />

      <h3 className={styles.subTitle}>대기 회원 관리</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>이름</th>
            <th>학번</th>
            <th>전공</th>
            <th>이메일</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {pagedPendingMembers.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>
                대기 중인 회원이 없습니다.
              </td>
            </tr>
          ) : (
            pagedPendingMembers.map((m) => (
              <tr key={m.id}>
                <td data-label="이름">{m.name}</td>
                <td data-label="학번">{m.studentId}</td>
                <td data-label="전공">{m.major}</td>
                <td data-label="이메일">{m.email}</td>
                <td data-label="상태">
                  {m.status === "pending_approval"
                    ? "승인 대기중"
                    : m.status}
                </td>
                <td data-label="관리">
                  <button
                    className={styles.manageBtn}
                    onClick={() => handlePendingDecision(m.id, true)}
                  >
                    승락
                  </button>
                  <button
                    className={styles.manageBtn}
                    onClick={() => handlePendingDecision(m.id, false)}
                  >
                    거절
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination
        page={pendingPage}
        total={pendingTotalPages}
        setPage={setPendingPage}
      />

      {isEditOpen && editTarget && (
        <div className={styles.modalOverlay} onClick={() => setIsEditOpen(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>회원 정보 수정</h3>

            <form
              className={styles.modalForm}
              onSubmit={async (e) => {
                e.preventDefault();

                try {
                  const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${editTarget.id}`,
                    {
                      method: "PATCH",
                      credentials: "include",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                      },
                      body: JSON.stringify(editForm),
                    }
                  );

                  if (!res.ok) throw new Error("회원 정보 수정 실패");

                  alert("회원 정보가 수정되었습니다.");
                  setIsEditOpen(false);
                  setEditTarget(null);
                  await fetchData(); 
                } catch (err) {
                  console.error(err);
                  alert("회원 정보 수정 중 오류가 발생했습니다.");
                }
              }}
            >
              <label>
                이름
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                학번
                <input
                  value={editForm.studentId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, studentId: e.target.value })
                  }
                />
              </label>

              <label>
                전공
                <input
                  value={editForm.major}
                  onChange={(e) =>
                    setEditForm({ ...editForm, major: e.target.value })
                  }
                />
              </label>

              <label>
                이메일
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  required
                />
              </label>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsEditOpen(false)}>
                  취소
                </button>
                <button type="submit">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
