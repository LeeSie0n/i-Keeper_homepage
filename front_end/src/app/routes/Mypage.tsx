import Loading from "@/components/common/Loading";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MyPage.module.css";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";

interface UserProfile {
  name: string;
  studentId: string;
  major: string;
  email: string;
  class: string;
  fileUrl?: string;
}

interface UserPost {
  id: number;
  category: string;
  title: string;
  createAt: string;
}

export default function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    major: "",
    class: "",
  });
  const [saving, setSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const categoryRouteMap: Record<string, string> = {
    support: "/support",
    gallery: "/gallery",
    teamBuilding: "/activities",
    seminar: "/seminar/seminar", //정보공유세미나
    keeperSeminar: "/seminar/KeeperSeminar", //키퍼세미나 
    special: "/seminar/special", //특강

    // 한글 카테고리 대응 (백엔드가 한글이면 필수)
    지원: "/support",
    갤러리: "/gallery",
    팀빌딩: "/activities",
    세미나: "/seminar/seminar",
    키퍼세미나: "/seminar/KeeperSeminar",
    특강: "/seminar/special",
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    async function fetchMyPage() {
      try {
        const userRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/me`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!userRes.ok) throw new Error("사용자 정보 불러오기 실패");
        const userData = await userRes.json();

        const postRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/posts?authorId=${userData.id}`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!postRes.ok) throw new Error("게시글 불러오기 실패");
        const postData = await postRes.json();

        const mappedUser: UserProfile = {
          name: userData.name || "이름 없음",
          studentId: userData.studentId || "-",
          major: userData.major || "-",
          email: userData.email || "-",
          class: userData.class || "-",
          fileUrl: userData.signatureFile?.url || "",
        };

        const mappedPosts: UserPost[] = Array.isArray(postData.posts)
          ? postData.posts.map((p: any) => ({
            id: p.id,
            category: p.category?.name || "기타",
            title: p.title || "제목 없음",
            createAt: new Date(p.createdAt).toLocaleDateString("ko-KR"),
          }))
          : [];

        setUser(mappedUser);
        setPosts(mappedPosts);
        setCurrentPage(1);

        setEditForm({
          major: mappedUser.major === "-" ? "" : mappedUser.major,
          class: mappedUser.class === "-" ? "" : mappedUser.class,
        });
      } catch (err) {
        console.error("마이페이지 데이터 불러오기 실패:", err);
        alert("서버 연결 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchMyPage();
  }, [navigate]);

  const handlePostClick = (post: UserPost) => {
    const basePath = categoryRouteMap[post.category];

    if (!basePath) {
      alert("이 게시글의 상세 페이지 경로를 찾을 수 없습니다.");
      return;
    }

    navigate(`${basePath}/${post.id}`);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!editForm.major.trim() && !editForm.class.trim()) {
      alert("수정할 내용이 없습니다.");
      setSaving(false);
      return;
    }

    try {
      setSaving(true);

      const body: any = {
        major: editForm.major.trim() || null,
        class: editForm.class.trim() || null,
      };

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/me`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        throw new Error("회원 정보 수정에 실패했습니다.");
      }

      const updated = await res.json();

      const updatedUser: UserProfile = {
        name: updated.name || "이름 없음",
        studentId: updated.studentId || "-",
        major: updated.major || "-",
        email: updated.email || user.email,
        class: updated.class || "-",
        fileUrl:
          updated.signatureFile?.url ||
          user.fileUrl,
      };

      setUser(updatedUser);
      setEditForm({
  major: updated.major === "-" ? "" : updated.major,
  class: updated.class === "-" ? "" : updated.class,
});

      setIsEditing(false);
      alert("회원 정보가 수정되었습니다.");
    } catch (err: any) {
      console.error("회원 정보 수정 오류:", err);
      alert(err.message || "회원 정보 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const total =
      posts.length === 0 ? 1 : Math.ceil(posts.length / postsPerPage);

    if (currentPage > total) {
      setCurrentPage(total);
    }
  }, [posts, currentPage]);

  if (loading) return <Loading />;
  if (!user) return <Loading message="회원 정보를 불러올 수 없습니다" />;

  const totalPages =
    posts.length === 0 ? 1 : Math.ceil(posts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = posts.slice(startIndex, startIndex + postsPerPage);

  return (
    <section className={`site-container ${styles.mypage}`}>
      <h2 className={styles.title}>My Page</h2>

      <div className={styles.profileHeaderRow}>
        <h3 className={styles.subTitle}>회원 정보</h3>
        <button
          type="button"
          className={styles.editButton}
          onClick={() => setIsEditing((v) => !v)}
        >
          {isEditing ? "수정 취소" : "내 정보 수정"}
        </button>
      </div>

      <table className={styles.infoTable}>
        <tbody>
          <tr>
            <th>이름</th>
            <td>{user.name}</td>
          </tr>
          <tr>
            <th>학번</th>
            <td>{user.studentId}</td>
          </tr>
          <tr>
            <th>전공</th>
            <td>{user.major}</td>
          </tr>
          <tr>
            <th>이메일</th>
            <td>{user.email}</td>
          </tr>
          <tr>
            <th>학년/학차</th>
            <td>{user.class}</td>
          </tr>
          {user.fileUrl && (
            <tr>
              <th>사인 파일</th>
              <td>
                <img
                  src={user.fileUrl}
                  alt="사인 이미지"
                  className={styles.signImg}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isEditing && (
        <form onSubmit={handleEditSubmit} className={styles.editForm}>
          <h4 className={styles.editTitle}>내 정보 수정</h4>

          <div className={styles.editRow}>
            <label>
              이름 *
              <input
                type="text"
                value={user.name}
                disabled
                className={styles.readOnlyInput}
              />
            </label>
          </div>

          <div className={styles.editRow}>
            <label>
              학번
              <input
                type="text"
                value={user.studentId}
                disabled
                className={styles.readOnlyInput}
              />
            </label>
          </div>

          <div className={styles.editRow}>
            <label>
              전공
              <input
                type="text"
                name="major"
                value={editForm.major}
                onChange={handleEditChange}
                placeholder="예) 컴퓨터소프트웨어학과"
              />
            </label>
          </div>

          <div className={styles.editRow}>
            <label>
              학년/학차
              <input
                type="text"
                name="class"
                value={editForm.class}
                onChange={handleEditChange}
                placeholder="예) 3/2"
              />
            </label>
          </div>

          <p className={styles.editHint}>
            이메일 및 사인 이미지 변경이 필요하면 임원진에게 별도로 문의해주세요.
          </p>

          <div className={styles.editActions}>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
              }}
              disabled={saving}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                (!editForm.major.trim() && !editForm.class.trim())
              }
            >

              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      )}

      <h3 className={styles.subTitle}>내가 작성한 글</h3>
      {posts.length > 0 ? (
        <>
          <table className={styles.postTable}>
            <thead>
              <tr>
                <th>카테고리</th>
                <th>제목</th>
                <th>작성일</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPosts.map((post) => (
                <tr
                  key={post.id}
                  className={styles.clickableRow}
                  onClick={() => handlePostClick(post)}
                >
                  <td>{post.category}</td>
                  <td>{post.title}</td>
                  <td>{post.createAt}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ===== 페이지네이션 ===== */}
          <div className={styles.pagination} role="navigation">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="이전 페이지"
            >
              <FaAnglesLeft />
            </button>

            {/* 데스크톱 */}
            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={
                      page === currentPage ? styles.activePage : ""
                    }
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* 모바일 */}
            <div className={styles.mobileIndicator} aria-hidden="true">
              {currentPage} / {totalPages}
            </div>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              aria-label="다음 페이지"
            >
              <FaAnglesRight />
            </button>
          </div>
        </>
      ) : (
        <p>작성한 글이 없습니다.</p>
      )}
    </section>
  );
}
