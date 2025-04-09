import Link from "next/link"
import styles from "../page.module.css"
import { ArrowRight, ChevronRight, Clock } from "lucide-react"
import { getSortedPostsData } from "../_lib/post"
import { formatDate } from "../_lib/util";

export default async function BlogSection() {
  const posts = getSortedPostsData();
  // 最新の記事を取得
  const latestPosts = [...await posts].slice(0, 3)

  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>最新の記事</h2>
          <p className={styles.sectionDescription}>私が最近書いた技術記事をご覧ください</p>
        </div>
        <Link href="/blog">
          <button className={`${styles.button} ${styles.buttonOutline}`}>
            すべての記事を見る
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </Link>
      </div>

      <div className={styles.cardGrid}>
        {latestPosts.map((post) => (
          <div key={post.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardMeta}>
                <Clock className="h-3.5 w-3.5" />
                {formatDate(post.date)}
              </div>
              <h3 className={styles.cardTitle}>{post.title}</h3>
              <p className={styles.cardDescription}>{post.title}</p>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardExcerpt}>{post.date}</p>
            </div>
            <div className={styles.cardFooter}>
              <Link href={`/blog/${post.id}`} className={styles.cardLink}>
                <span>続きを読む</span>
                <ChevronRight className={`h-4 w-4 ${styles.cardLinkIcon}`} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}