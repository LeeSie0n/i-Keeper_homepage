"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./ChatbotPopup.module.css";

interface Message {
  text: string;
  type: "me" | "bot";
}

export default function ChatbotPopup() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const CHATBOT_API = process.env.NEXT_PUBLIC_CHATBOT_API as string;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;

    setMessages(prev => [
      ...prev,
      { text: userMessage, type: "me" }
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(CHATBOT_API,{
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      const data = await res.json();

      setMessages(prev => {
        if (prev.some(m => m.text === data.reply)) return prev;
        return [...prev, { text: data.reply, type: "bot" }];
      });
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { text: "서버 연결 오류가 발생했습니다.", type: "bot" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        id="chatbotBtn"
        className={styles.chatbotBtn}
        onClick={() => setOpen(true)}
      >
        Chatbot
      </button>

      {open && (
        <div id="chatPopup" className={styles.popup}>
          <div className={styles.header}>
            <span>i-Keeper Chatbot</span>
            <button id="closeBtn" onClick={() => setOpen(false)}>
              X
            </button>
          </div>

          <div id="chatBody" className={styles.body}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={msg.type === "me" ? styles.me : styles.bot}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))}
            {loading && (
              <div className={styles.bot}>답변 중...</div>
            )}
          </div>

          <input
            id="userInput"
            type="text"
            placeholder="질문을 입력하세요"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button id="sendBtn" onClick={sendMessage}>
            Send
          </button>
        </div>
      )}
    </>
  );
}
