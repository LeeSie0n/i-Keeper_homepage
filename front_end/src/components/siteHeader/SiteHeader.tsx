// SiteHeader.tsx
import { NavLink, Link, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import styles from "./SiteHeader.module.css";
import cn from "classnames";

export default function SiteHeader() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);

  const toggleMobileDropdown = (key: string) => {
    setMobileDropdown((prev) => (prev === key ? null : key));
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [hoverDropdown, setHoverDropdown] = useState<string | null>(null);

  useEffect(() => {
    setHoverDropdown(null);
    setMobileDropdown(null);
  }, [location]);

  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem("token");
      const savedRole = localStorage.getItem("role");
      setIsLoggedIn(!!token);
      setRole(savedRole);
    };

    checkLogin();
    window.addEventListener("login", checkLogin);
    window.addEventListener("logout", checkLogin);
    return () => {
      window.removeEventListener("login", checkLogin);
      window.removeEventListener("logout", checkLogin);
    };
  }, []);

  const escHandler = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (open) window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, [open, escHandler]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("logout"));
    setIsLoggedIn(false);
    setRole(null);
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    window.location.href = "/";
  };

  return (
    <>
      <header className={styles.siteHeader}>
        <div className={styles.site_container}>
          {/* 로고 */}
          <div className={styles.logoWrap}>
            <Link to="/">
              <img
                src="/img/i-Keeper_Logo.png"
                alt="i-keeper"
                className={styles.logoImg}
              />
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className={styles.nav}>
            <ul className={styles.menu}>
              {isLoggedIn ? (
                <>
                  {/* i-Keeper 드롭다운 */}
                  <li
                    className={styles.dropdown}
                    onMouseEnter={() => setHoverDropdown("iKeeper")}
                    onMouseLeave={() => setHoverDropdown(null)}
                  >
                    <span className={styles.dropdown_container}>i-Keeper</span>
                    <ul
                      className={styles.submenu}
                      style={{
                        display: hoverDropdown === "iKeeper" ? "block" : "none",
                      }}
                    >
                      <li>
                        <NavLink to="/about" className={styles.fullArea}>
                          About
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/rule" className={styles.fullArea}>
                          Rule
                        </NavLink>
                      </li>
                    </ul>
                  </li>

                  {/* Notice */}
                  <li>
                    <NavLink
                      to="/notice"
                      className={cn(
                        styles.dropdown_container,
                        styles.fullArea
                      )}
                    >
                      Notice
                    </NavLink>
                  </li>

                  {/* Activity 드롭다운 */}
                  <li
                    className={styles.dropdown}
                    onMouseEnter={() => setHoverDropdown("activity")}
                    onMouseLeave={() => setHoverDropdown(null)}
                  >
                    <span className={styles.dropdown_container}>Activity</span>
                    <ul
                      className={styles.submenu}
                      style={{
                        display:
                          hoverDropdown === "activity" ? "block" : "none",
                      }}
                    >
                      <li>
                        <NavLink to="/gallery" className={styles.fullArea}>
                          Gallery
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/activities" className={styles.fullArea}>
                          TeamBuild
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/seminar" className={styles.fullArea}>
                          Seminar
                        </NavLink>
                      </li>
                    </ul>
                  </li>

                  {/* ETC 드롭다운 */}
                  <li
                    className={styles.dropdown}
                    onMouseEnter={() => setHoverDropdown("etc")}
                    onMouseLeave={() => setHoverDropdown(null)}
                  >
                    <span className={styles.dropdown_container}>ETC</span>
                    <ul
                      className={styles.submenu}
                      style={{
                        display: hoverDropdown === "etc" ? "block" : "none",
                      }}
                    >
                      <li>
                        <NavLink to="/library" className={styles.fullArea}>
                          Library
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/cleaning" className={styles.fullArea}>
                          Clean
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/fee" className={styles.fullArea}>
                          Fee
                        </NavLink>
                      </li>
                    </ul>
                  </li>

                  {/* Support */}
                  <li>
                    <NavLink
                      to="/support"
                      className={cn(
                        styles.dropdown_container,
                        styles.fullArea
                      )}
                    >
                      Support
                    </NavLink>
                  </li>
                </>
              ) : (
                <>
                  {/* 비회원 메뉴 */}
                  <li className={styles.dropdown_container}>
                    <NavLink to="/about" className={styles.fullArea}>
                      i-Keeper
                    </NavLink>
                  </li>
                  <li className={styles.dropdown_container}>
                    <NavLink to="/notice" className={styles.fullArea}>
                      Notice
                    </NavLink>
                  </li>
                  <li className={styles.dropdown_container}>
                    <NavLink to="/gallery" className={styles.fullArea}>
                      Gallery
                    </NavLink>
                  </li>
                  <li className={styles.dropdown_container}>
                    <NavLink to="/library" className={styles.fullArea}>
                      Library
                    </NavLink>
                  </li>
                  <li className={styles.dropdown_container}>
                    <NavLink to="/fee" className={styles.fullArea}>
                      Fee
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* 로그인/회원가입 or 마이페이지/로그아웃 */}
          <div className={styles.authLinks}>
            {!isLoggedIn ? (
              <>
                <NavLink to="/login" className={styles.authLink}>
                  LOGIN
                </NavLink>
                <NavLink to="/signup" className={styles.authLink}>
                  JOIN
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/mypage" className={styles.authLink}>
                  MYPAGE
                </NavLink>
                {role === "admin" && (
                  <NavLink to="/officer" className={styles.authLink}>
                    MANAGEMENT
                  </NavLink>
                )}
                <button onClick={handleLogout} className={styles.authLink}>
                  LOGOUT
                </button>
              </>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
        {open && (
          <div
            className={styles.sideMenuOverlay}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          >
            <aside
              className={`${styles.sideMenu} ${styles.slideIn}`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <nav className={styles.sideNav}>
                {/* i-Keeper */}
                <div className={styles.sideDropdown}>
                  <button
                    type="button"
                    className={styles.sideDropdownBtn}
                    onClick={() => toggleMobileDropdown("iKeeper")}
                    aria-expanded={mobileDropdown === "iKeeper"}
                  >
                    <span>i-Keeper</span>
                    <span
                      className={cn(
                        styles.sideChevron,
                        mobileDropdown === "iKeeper" && styles.sideChevronOpen
                      )}
                    >
                      ▾
                    </span>
                  </button>

                  <ul
                    className={cn(
                      styles.sideSubmenu,
                      mobileDropdown === "iKeeper" && styles.sideSubmenuOpen
                    )}
                  >
                    <li>
                      <NavLink to="/about" className={styles.fullArea} onClick={() => setOpen(false)}>
                        About
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/rule" className={styles.fullArea} onClick={() => setOpen(false)}>
                        Rule
                      </NavLink>
                    </li>
                  </ul>
                </div>

                {/* Activity */}
                <div className={styles.sideDropdown}>
                  <button
                    type="button"
                    className={styles.sideDropdownBtn}
                    onClick={() => toggleMobileDropdown("activity")}
                    aria-expanded={mobileDropdown === "activity"}
                  >
                    <span>Activity</span>
                    <span
                      className={cn(
                        styles.sideChevron,
                        mobileDropdown === "activity" && styles.sideChevronOpen
                      )}
                    >
                      ▾
                    </span>
                  </button>

                  <ul
                    className={cn(
                      styles.sideSubmenu,
                      mobileDropdown === "activity" && styles.sideSubmenuOpen
                    )}
                  >
                    <li>
                      <NavLink to="/gallery" className={styles.fullArea} onClick={() => setOpen(false)}>
                        Gallery
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/activities" className={styles.fullArea} onClick={() => setOpen(false)}>
                        TeamBuild
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/seminar" className={styles.fullArea} onClick={() => setOpen(false)}>
                        Seminar
                      </NavLink>
                    </li>
                  </ul>
                </div>

                {/* ETC */}
                <div className={styles.sideDropdown}>
                  <button
                    type="button"
                    className={styles.sideDropdownBtn}
                    onClick={() => toggleMobileDropdown("etc")}
                    aria-expanded={mobileDropdown === "etc"}
                  >
                    <span>ETC</span>
                    <span
                      className={cn(
                        styles.sideChevron,
                        mobileDropdown === "etc" && styles.sideChevronOpen
                      )}
                    >
                      ▾
                    </span>
                  </button>

                  <ul
                    className={cn(
                      styles.sideSubmenu,
                      mobileDropdown === "etc" && styles.sideSubmenuOpen
                    )}
                  >
                    <li>
                      <NavLink to="/library" className={styles.fullArea} onClick={() => setOpen(false)}>
                        Library
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/cleaning" className={styles.fullArea} onClick={() => setOpen(false)}>
                        Clean
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/fee" className={styles.fullArea} onClick={() => setOpen(false)}>
                        Fee
                      </NavLink>
                    </li>
                  </ul>
                </div>

                <NavLink to="/notice" className={styles.sideDropdownBtn} onClick={() => setOpen(false)}>
                  Notice
                </NavLink>
                <NavLink to="/support" className={styles.sideDropdownBtn} onClick={() => setOpen(false)}>
                  Support
                </NavLink>
              </nav>

              <div className={styles.sideAuth}>
                {!isLoggedIn ? (
                  <>
                    <NavLink to="/login" onClick={() => setOpen(false)}>LOGIN</NavLink>
                    <NavLink to="/signup" onClick={() => setOpen(false)}>JOIN</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/mypage" onClick={() => setOpen(false)}>MYPAGE</NavLink>
                    {role === "admin" && (
                      <NavLink to="/officer" onClick={() => setOpen(false)}>MANAGEMENT</NavLink>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                    >
                      LOGOUT
                    </button>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}

      </header>
    </>
  );
}
