import { useState } from "react";
import { requestPasswordReset } from "@/api/api.ts";
import styles from "./Auth.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err: any) {
      alert(err?.message || "요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`site-container ${styles.auth}`}>
      <h2>비밀번호 찾기</h2>

      {sent ? (
        <p className={styles.notice}>
          입력하신 이메일로 비밀번호 재설정 안내를 전송했습니다.
        </p>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="가입한 이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "전송 중..." : "비밀번호 찾기"}
          </button>
        </form>
      )}
    </section>
  );
}
