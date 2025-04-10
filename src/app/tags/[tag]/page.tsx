import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, Tag } from "lucide-react"
import styles from "../../blog/page.module.css"
import { getSortedPostsData } from "../../_lib/post"
import { formatDate } from "../../_lib/util"

interface TagPageProps {
  params: Promise<{
    tag: string
  }>
}

export async function generateStaticParams() {
  const posts = await getSortedPostsData();
  const tags = new Set(posts.flatMap((post) => post.tags || []))

  return Array.from(tags).map((tag) => ({
    tag: tag,
  }))
}

export async function generateMetadata({ params }: TagPageProps) {
  const param = await Promise.resolve(params);
  const decodedTag = decodeURIComponent(param.tag)

  return {
    title: `${decodedTag}に関する記事 | ぺんじにあの部屋`,
    description: `${decodedTag}に関するブログ記事の一覧です`,
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const param = await Promise.resolve(params);
  const decodedTag = decodeURIComponent(param.tag)
  const allPosts = await getSortedPostsData()

  // 指定されたタグを持つ記事をフィルタリング
  const filteredPosts = allPosts.filter((post) => post.tags?.includes(decodedTag))

  if (filteredPosts.length === 0) {
    notFound()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/blog">
          <button className="button button-outline mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            記事一覧に戻る
          </button>
        </Link>

        <h1 className={styles.title}>
          <span className="inline-block bg-secondary text-secondary-foreground px-3 py-1 rounded-full mb-2">
            {decodedTag}
          </span>
          <span className="block">に関する記事</span>
        </h1>
        <p className={styles.description}>{filteredPosts.length}件の記事が見つかりました</p>
      </div>

      <div className={styles.content}>
        <div className={styles.posts}>
          {filteredPosts.map((post) => (
            <article key={post.id} className={styles.post}>
              <Link href={`/blog/${post.id}`} className={styles.postLink}>
                <div className={styles.postContent}>
                  <h2 className={styles.postTitle}>{post.title}</h2>

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
                            <span
                              key={tag}
                              className={`${styles.tag} ${tag === decodedTag ? "bg-primary text-primary-foreground" : ""}`}
                            >
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
            <h3 className={styles.sidebarTitle}>他のカテゴリー</h3>
            <div className={styles.categories}>
              {/* 現在のタグ以外のタグを表示 */}
              {Array.from(new Set(allPosts.flatMap((post) => post.tags || [])))
                .filter((tag) => tag !== decodedTag)
                .map((tag) => (
                  <Link href={`/tags/${tag}`} key={tag} className={styles.category}>
                    {tag}
                  </Link>
                ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>最近の投稿</h3>
            <ul className={styles.recentPosts}>
              {allPosts.slice(0, 5).map((post) => (
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
