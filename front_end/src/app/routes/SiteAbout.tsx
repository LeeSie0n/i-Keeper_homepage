import KakaoMap from "@/components/map/KakaoMap";
import styles from "./SiteAbout.module.css";

export default function SiteAbout() {
  const members = [
    {
      name: "은은솔",
      title: "회장",
      info: "(3학년, 컴퓨터공학전공)",
      desc: (
        <>
        </>
      ),
      img: "/img/Eunsol_Profile.png",
    },
    {
      name: "김시은",
      title: "부회장",
      info: "(3학년, 컴퓨터공학전공)",
      desc: (
        <>
        </>
      ),
      img: "/img/Sieun_Profile.png",
    },
    {
      name: "이시언",
      title: "써트장",
      info: "(3학년, 컴퓨터공학전공)",
      desc: (
        <>
        </>
      ),
      img: "/img/Sieon_Profile.png",
    },
    {
      name: "권구준",
      title: "써트부장",
      info: "(2학년, 사이버보안전공)",
      desc: (
        <>

        </>
      ),
      img: "/img/Guejun_Profile.png",
    },
    {
      name: "이대근",
      title: "교육부장",
      info: "(2학년, 컴퓨터공학전공)",
      desc: (
        <>
        </>
      ),
      img: "/img/Daegeun_Profile.png",
    },
    {
      name: "남우석",
      title: "장비부장",
      info: "(2학년, 사이버보안전공)",
      desc: (
        <>

        </>
      ),
      img: "/img/Wooseok_Profile.png",
    },
    {
      name: "이사윤",
      title: "총무",
      info: "(2학년, 컴퓨터공학전공)",
      desc: (
        <>

        </>
      ),
      img: "/img/Sayoon_Profile.png",
    },
  ];

  return (
    <section className={`site-container ${styles.about}`}>
      <div className={styles.intro}>
        <img
          src="/img/i-Keeper_Logo.png"
          alt="i-Keeper"
          className={styles.logo}
        />
        <div>
          <p className={styles.desc}>
            소프트웨어 개발 & 보안 동아리 'i-Keeper'는 대구가톨릭대학교 소프트웨어융합대학 소속으로,<br />
            '교육의 선순환'이라는 모토 아래 학교 내외 학우들이 지식을 공유하고 성장할 수 있는 기회를 마련하고자 2002년 9월 처음 설립되었습니다.<br />
            멘토링 및 프로젝트, 세미나 등 다양한 활동을 통해 꾸준한 배움을 추구합니다.
          </p>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>임원진</h3>
      <div className={styles.members}>
        {members.map((m, idx) => (
          <div key={idx} className={styles.card}>
            <img src={m.img} alt={m.name} className={styles.memberImg} />
            <h4 className={styles.memberName}>
              {m.name} <span>{m.info}</span>
            </h4>
            <p className={styles.memberRole}>{m.title}</p>
            <p className={styles.memberDesc}>{m.desc}</p>
          </div>
        ))}
      </div>

      <div className={styles.mapSection}>
        <div className={styles.mapContainer}>
          <KakaoMap lat={35.913655} lng={128.802581} level={3} />
        </div>

        <div className={styles.address}>
          <h4>Information</h4>
          <p>Club : i-Keeper</p>
          <p>Address : 경상북도 경산시 하양읍 하양로 13-13 공학관(D2) 509호 (하양읍, 대구가톨릭대학교)</p>
          <p>Contact : 010.0000.0000</p>
          <p>Email : sieon0000@naver.com</p>
        </div>
      </div>

    </section>
  );
}
