import { loginApi } from "@/api/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";

const MAX_LOGIN_ATTEMPTS = 5;

function getFailedAttempts(email: string): number {
  if (!email) return 0;
  const value = localStorage.getItem(`login_failed_${email}`);
  return value ? parseInt(value, 10) : 0;
}

function setFailedAttempts(email: string, count: number) {
  if (!email) return;
  localStorage.setItem(`login_failed_${email}`, String(count));
}

function resetFailedAttempts(email: string) {
  if (!email) return;
  localStorage.removeItem(`login_failed_${email}`);
}

function isAccountLocked(email: string): boolean {
  if (!email) return false;
  return localStorage.getItem(`login_locked_${email}`) === "true";
}

function lockAccount(email: string) {
  if (!email) return;
  localStorage.setItem(`login_locked_${email}`, "true");
}

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formData.email.trim();

    if (isAccountLocked(email)) {
      alert(
        "해당 계정은 비밀번호 5회 이상 오류로 잠긴 상태입니다.\n" +
        "임원진에게 문의하여 계정 해제를 요청해 주세요."
      );
      return;
    }
    setLoading(true);

    try {
      const data = await loginApi(formData.email, formData.password);
      resetFailedAttempts(email);
      localStorage.removeItem(`login_locked_${email}`);

      localStorage.setItem("token", data.accessToken || "");
      localStorage.setItem("role", data.user?.role || "member");
      window.dispatchEvent(new Event("login"));
      navigate("/");
    } catch (err: any) {
      const current = getFailedAttempts(email);
      const next = current + 1;
      setFailedAttempts(email, next);

      if (next >= MAX_LOGIN_ATTEMPTS) {
        lockAccount(email);
        alert(
          "비밀번호를 5회 이상 잘못 입력하여 계정이 잠겼습니다.\n" +
          "임원진에게 문의하여 계정 해제를 요청해 주세요."
        );
      } else {
        const remain = MAX_LOGIN_ATTEMPTS - next;
        alert(
          (err?.message || "로그인 실패") +
          `\n\n남은 시도 가능 횟수: ${remain}회 (총 ${MAX_LOGIN_ATTEMPTS}회 초과 시 계정 잠금)`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`site-container ${styles.auth}`}>
      <h2>로그인</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="이메일"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "로그인 중" : "로그인"}
        </button>

        <button
          type="button"
          className={styles.forgot}
          onClick={() => navigate("/forgot-password")}
        >
          비밀번호를 잊으셨나요?
        </button>
      </form>
    </section>
  );
}
