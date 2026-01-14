import { useState, useEffect } from "react";
import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token); 
    };

    checkLogin();
    window.addEventListener("login", checkLogin);
    window.addEventListener("logout", checkLogin);

    return () => {
      window.removeEventListener("login", checkLogin);
      window.removeEventListener("logout", checkLogin);
    };
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <nav className={styles.nav}>
            {isLoggedIn ? (
              <>
                <a href="/about">i-Keeper</a>
                <a href="/notice">Notice</a>
                <a href="/gallery">Activity</a>
                <a href="/library">ETC</a>
                <a href="/support">Support</a>
              </>
            ) : (
              <>
                <a href="/about">i-Keeper</a>
                <a href="/notice">Notice</a>
                <a href="/gallery">Gallery</a>
                <a href="/library">Library</a>
                <a href="/fee">Fee</a>
              </>
            )}
          </nav>

          <div className={styles.info}>
            <p>
              Club : i-Keeper &nbsp;&nbsp; Address : 경상북도 경산시 하양읍 하양로 13-13 공학관(D2) 509호 (하양읍, 대구가톨릭대학교)
            </p>
          </div>

          <div className={styles.copy}>
            COPYRIGHT (C) i-Keeper ALL RIGHTS RESERVED.
          </div>
        </div>
        
        <div className={styles.right}>
          <img
            src="/img/KUCIS_Logo.png"
            alt="KUCIS"
            className={styles.partnerLogo}
          />
          <img
            src="/img/INCOGNITO_Logo.png"
            alt="INC0GNITO"
            className={styles.partnerLogo}
          />
          <img
            src="/img/HSPACE_Logo.png"
            alt="HSPACE"
            className={styles.partnerLogo}
          />
        </div>
      </div>
    </footer>
  );
}
