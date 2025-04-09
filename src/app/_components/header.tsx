"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Code, Menu, X } from "lucide-react"
import styles from "./header.module.css"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // メニューが開いているときに背景スクロールを防止
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.headerContainer}`}>
          <div className={styles.logoContainer}>
            <button onClick={toggleMenu} className={styles.menuButton} aria-label="メニューを開く">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className={styles.logoContainer}>
              <Code className={`h-6 w-6 ${styles.logo}`} />
              <span className={styles.logoText}>ぺんじにあの部屋</span>
              <span className={styles.logoTextMobile}>ぺんじにあの部屋</span>
            </Link>
          </div>

          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              ホーム
            </Link>
            <Link href="/about" className={styles.navLink}>
              プロフィール
            </Link>
            <Link href="/blog" className={styles.navLink}>
              ブログ
            </Link>
          </nav>
        </div>
      </header>

      {/* モバイルメニュー - ヘッダーの外に配置 */}
      {isMenuOpen && (
        <div className={styles.mobileMenuWrapper}>
          <div className={styles.mobileMenuOverlay} onClick={() => setIsMenuOpen(false)}></div>
          <div className={styles.mobileMenuContainer}>
            <div className={styles.mobileMenuHeader}>
              <Link href="/" className={styles.logoContainer} onClick={() => setIsMenuOpen(false)}>
                <Code className={styles.logo} />
                <span className={styles.logoText}>ぺんじにあの部屋</span>
              </Link>
            </div>
            <nav className={styles.mobileNav}>
              <Link href="/" className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                ホーム
              </Link>
              <Link href="/about" className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                プロフィール
              </Link>
              <Link href="/blog" className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                ブログ記事一覧
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
