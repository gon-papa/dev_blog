import Link from "next/link"
import { Calendar, Tag } from "lucide-react"
import styles from "./page.module.css"
import { formatDate } from "@/app/_lib/util"
import { getSortedPostsData } from "@/app/_lib/post"

export const metadata = {
  title: "ブログ記事一覧 | 山田太郎のエンジニアブログ",
  description: "Web開発、プログラミング、テクノロジーに関する記事の一覧です",
}

export default async function BlogPage() {
  const posts = await getSortedPostsData()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>ブログ記事一覧</h1>
        <p className={styles.description}>Web開発、プログラミング、テクノロジーに関する記事を公開しています</p>
      </div>

      <div className={styles.content}>
        <div className={styles.posts}>
          {posts.map((post) => (
            <article key={post.id} className={styles.post}>
              <Link href={`/blog/${post.id}`} className={styles.postLink}>
                <div className={styles.postContent}>
                  <h2 className={styles.postTitle}>{post.title}</h2>
                  {/* <p className={styles.postDescription}>{post.description || post.excerpt}</p> */}

                  <div className={styles.postMeta}>
                    <div className={styles.postDate}>
                      <Calendar className="h-3.5 w-3.5" />
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className={styles.postTags}>
                        <Tag className="h-3.5 w-3.5" />
                        <div className={styles.tagList}>
                          {post.tags.map((tag) => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>カテゴリー</h3>
            <div className={styles.categories}>
              {/* タグの重複を除去して一覧を表示 */}
              {Array.from(new Set(posts.flatMap((post) => post.tags || []))).map((tag) => (
                <Link href={`/tags/${tag}`} key={tag} className={styles.category}>
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>最近の投稿</h3>
            <ul className={styles.recentPosts}>
              {posts.slice(0, 5).map((post) => (
                <li key={post.id} className={styles.recentPost}>
                  <Link href={`/blog/${post.id}`} className={styles.recentPostLink}>
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

