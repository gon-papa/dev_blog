import Link from "next/link"
import { Code } from "lucide-react"
import styles from "./footer.module.css"

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.content}>
          <div className={styles.about}>
            <Link href="/" className={styles.logo}>
              <Code className={`h-5 w-5 ${styles.logoIcon}`} />
              <span className={styles.logoText}>ぺんじにあの部屋</span>
            </Link>
            <p className={styles.description}>
              日々の気付きや、技術的な発見をつらつらとゆるく書いています。
            </p>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h3 className={styles.linkGroupTitle}>コンテンツ</h3>
              <ul className={styles.linkList}>
                <li className={styles.linkItem}>
                  <Link href="/" className={styles.link}>
                    ホーム
                  </Link>
                </li>
                <li className={styles.linkItem}>
                  <Link href="/about" className={styles.link}>
                    プロフィール
                  </Link>
                </li>
                <li className={styles.linkItem}>
                  <Link href="/blog" className={styles.link}>
                    ブログ記事一覧
                  </Link>
                </li>
                <li className={styles.linkItem}>
                  <Link href="/projects" className={styles.link}>
                    プロジェクト
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.separator}></div>

        <div className={styles.copyright}>
          <p>&copy; {new Date().getFullYear()} ぺんじにあ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

