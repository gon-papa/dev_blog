import Link from "next/link"
import { Code, Menu, Search } from "lucide-react"
import styles from "./header.module.css"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContainer}`}>
        <div className={styles.logoContainer}>
          <Sheet>
            <SheetTrigger asChild>
              <button className={styles.menuButton}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">メニューを開く</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className={styles.mobileMenu}>
                <Link href="/" className={styles.logoContainer}>
                  <Code className={styles.logo} />
                  <span className={styles.logoText}>ぺんじにあの部屋</span>
                </Link>
                <nav className={styles.mobileNav}>
                  <Link href="/" className={styles.mobileNavLink}>
                    ホーム
                  </Link>
                  <Link href="/about" className={styles.mobileNavLink}>
                    プロフィール
                  </Link>
                  <Link href="/blog" className={styles.mobileNavLink}>
                    ブログ記事一覧
                  </Link>
                  <Link href="/projects" className={styles.mobileNavLink}>
                    プロジェクト
                  </Link>
                  <Link href="/contact" className={styles.mobileNavLink}>
                    お問い合わせ
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className={styles.logoContainer}>
            <Code className={`h-6 w-6 ${styles.logo}`} />
            <span className={styles.logoText}>ぺんじにあの部屋</span>
            <span className={styles.logoTextMobile}>ぺんじにあの部屋</span>
          </Link>
        </div>

        <div className={styles.searchContainer}>
          <Search className={`h-4 w-4 ${styles.searchIcon}`} />
          <input type="search" placeholder="記事を検索..." className={styles.searchInput} />
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
          <Link href="/projects" className={styles.navLink}>
            プロジェクト
          </Link>
        </nav>

        <div className={styles.actions}>
          <Link href="/contact" className={styles.contactButton}>
            <button className="button button-outline">お問い合わせ</button>
          </Link>
        </div>
      </div>
    </header>
  )
}
