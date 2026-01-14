import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordApi } from "@/api/api";
import styles from "./Auth.module.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("유효하지 않은 접근입니다.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPasswordApi(token, password);

      // 프론트 단 계정 잠금 상태 초기화
      Object.keys(localStorage)
        .filter((k) => k.startsWith("login_locked_"))
        .forEach((k) => localStorage.removeItem(k));

      setDone(true);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "비밀번호 재설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`site-container ${styles.auth}`}>
      <h2>비밀번호 재설정</h2>

      {error && <p className={styles.error}>{error}</p>}

      {done ? (
        <p className={styles.notice}>
          비밀번호가 성공적으로 변경되었습니다.
          <br />
          잠시 후 로그인 페이지로 이동합니다.
        </p>
      ) : (
        token && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="새 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        )
      )}
    </section>
  );
}
