import type { EventInput } from "@fullcalendar/core";
import koLocale from "@fullcalendar/core/locales/ko";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { useEffect, useState } from "react";
import Loading from "../common/Loading";
import styles from "./ClubCalendar.module.css";

interface ClubEvent {
  id: number;
  title: string;
  startDate: string;
  endDate?: string;
}

function formatLocdate(locdate: string) {
  locdate = locdate.toString();
  return `${locdate.slice(0, 4)}-${locdate.slice(4, 6)}-${locdate.slice(
    6,
    8
  )}`;
}

async function fetchHolidays(year: number): Promise<Record<string, string>> {
  const key = import.meta.env.VITE_HOLIDAY_API_KEY;
  const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${key}&solYear=${year}&numOfRows=100&_type=json`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("공휴일 API 요청 실패");
    const json = await resp.json();
    const items = json.response?.body?.items?.item ?? [];

    const parsed: Record<string, string> = {};

    items.forEach((item: any) => {
      if (item.isHoliday === "Y") {
        const formattedDate = formatLocdate(item.locdate);
        parsed[formattedDate] = item.dateName;
      }
    });

    return parsed;
  } catch (err) {
    console.error("공휴일 API 오류:", err);
    return {};
  }
}

// "YYYY-MM-DDTHH:mm" 을 한국 시간(KST, UTC+9) 기준 ISO 문자열로 변환
function toKoreaISOString(localDateTime: string) {
  if (!localDateTime) return "";
  const withOffset = `${localDateTime}:00+09:00`;
  const d = new Date(withOffset);
  return d.toISOString();
}

export default function ClubCalendar() {
  const [clubEvents, setClubEvents] = useState<ClubEvent[]>([]);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsAdmin(role === "admin");
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/events`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) throw new Error("일정 데이터를 불러오지 못했습니다.");
        const data = await res.json();

        const mapped: ClubEvent[] = (data.events || []).map((e: any) => ({
          id: e.id,
          title: e.title,
          startDate: e.startDate,
          endDate: e.endDate ?? undefined,
        }));
        setClubEvents(mapped);

        const year = new Date().getFullYear();
        const holidayData = await fetchHolidays(year);
        setHolidays(holidayData);
      } catch (err: any) {
        console.error("데이터 로드 실패:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const clubEventInputs: EventInput[] = clubEvents.map((e) => ({
    id: String(e.id),
    title: e.title,
    start: e.startDate,
    end: e.endDate ?? undefined,
  }));

  const holidayEventInputs: EventInput[] = Object.entries(holidays).map(
    ([date, name]) => ({
      title: name,
      start: date,
      allDay: true,
      className: "holiday-event",
      display: "auto",
    })
  );

  useEffect(() => {
    const dayCells = document.querySelectorAll(".fc-daygrid-day");
    dayCells.forEach((cell) => {
      const dateStr = cell.getAttribute("data-date");
      if (dateStr && holidays[dateStr]) {
        cell.classList.add("is-holiday");
        cell.setAttribute("title", holidays[dateStr]);
      }
    });
  }, [holidays]);

  const openModal = () => {
    setNewTitle("");
    setNewStart("");
    setNewEnd("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!newStart) {
      alert("시작 일시를 선택해주세요.");
      return;
    }
    if (!newEnd) {
      alert("종료 일시를 선택해주세요.");
      return;
    }

    try {
      setSaving(true);

      const body = {
        title: newTitle.trim(),
        description: "",
        startDate: toKoreaISOString(newStart),
        endDate: toKoreaISOString(newEnd),
        location: "",
        eventType: "club",
      };

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/events`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        throw new Error("일정 등록에 실패했습니다.");
      }

      const result = await res.json();
      const created = result.event || result;

      const newEvent: ClubEvent = {
        id: created.id,
        title: created.title,
        startDate: created.startDate,
        endDate: created.endDate ?? undefined,
      };
      setClubEvents((prev) => [...prev, newEvent]);

      alert("일정이 등록되었습니다.");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("일정 등록 오류:", err);
      alert(err.message || "일정 등록 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (!window.confirm("이 일정을 삭제하시겠습니까?")) return;

    try {
      setDeleting(true);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/events/${selectedEvent.id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("일정 삭제에 실패했습니다.");
      }

      setClubEvents((prev) =>
        prev.filter((e) => e.id !== selectedEvent.id)
      );

      alert("일정이 삭제되었습니다.");
      setIsDetailOpen(false);
      setSelectedEvent(null);
    } catch (err: any) {
      console.error("일정 삭제 오류:", err);
      alert(err.message || "일정 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.calendarWrap}>
        <p style={{ color: "red" }}>데이터 로드 중 오류 발생: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.calendarWrap}>
      <div className={styles.calendarHeader}>
        <h2 className={styles.calendarTitle}>Club Calendar</h2>
        {isAdmin && (
          <button
            type="button"
            className={styles.addEventBtn}
            onClick={openModal}
          >
            일정 추가
          </button>
        )}
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: undefined,
        }}
        locale={koLocale}
        timeZone="Asia/Seoul"
        nowIndicator={true}
        height="auto"
        firstDay={0}
        dayHeaderFormat={{ weekday: "short" }}
        events={[...clubEventInputs, ...holidayEventInputs]}
        dateClick={(info) => {
          if (isAdmin) {
            setNewTitle("");
            setNewStart(`${info.dateStr}T10:00`);
            setNewEnd(`${info.dateStr}T12:00`);
            setIsModalOpen(true);
          }
        }}
        eventClick={(info) => {
          if (info.event.classNames.includes("holiday-event")) {
            return;
          }

          const clickedId = Number(info.event.id);
          const found = clubEvents.find((e) => e.id === clickedId);
          if (!found) return;

          setSelectedEvent(found);
          setIsDetailOpen(true);
        }}
        eventContent={(arg) => {
          if (arg.event.classNames.includes("holiday-event")) {
            return <span className="holiday-event">{arg.event.title}</span>;
          }
          return <span>{arg.event.title}</span>;
        }}
      />

      <style>{`
        .holiday-event {
          color: red !important;
          font-weight: 600;
        }
        .is-holiday {
          background-color: #fff1f1 !important;
        }
      `}</style>

      {isAdmin && isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>일정 추가</h3>
            <form onSubmit={handleCreateEvent} className={styles.modalForm}>
              <label className={styles.modalLabel}>
                제목
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={styles.modalInput}
                  required
                />
              </label>

              <label className={styles.modalLabel}>
                시작 일시
                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className={styles.modalInput}
                  required
                />
              </label>

              <label className={styles.modalLabel}>
                종료 일시
                <input
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className={styles.modalInput}
                  required
                />
              </label>

              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} disabled={saving}>
                  취소
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEvent && isDetailOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (!deleting) {
              setIsDetailOpen(false);
              setSelectedEvent(null);
            }
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>일정 정보</h3>

            <div className={styles.modalForm}>
              <p>
                <strong>제목</strong>
                <br />
                {selectedEvent.title}
              </p>
              <p>
                <strong>시작</strong>
                <br />
                {new Date(selectedEvent.startDate).toLocaleString("ko-KR")}
              </p>
              {selectedEvent.endDate && (
                <p>
                  <strong>종료</strong>
                  <br />
                  {new Date(selectedEvent.endDate).toLocaleString("ko-KR")}
                </p>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setIsDetailOpen(false);
                    setSelectedEvent(null);
                  }
                }}
                disabled={deleting}
              >
                닫기
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                  style={{ marginLeft: "8px" }}
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
