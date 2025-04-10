import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { ArrowLeft, Calendar, Tag } from "lucide-react"
import MarkdownContent from "../../_components/markdown-content"
import styles from "./page.module.css"
import { getPostById, getSortedPostsData } from "../../_lib/post"

interface BlogPostProps {
  params: Promise<{
    id: string
  }>
}

// 静的生成のためのパスを生成
export async function generateStaticParams() {
  const posts = await getSortedPostsData()
  return posts.map((post) => ({ id: post.id }))
}

// メタデータを生成
export async function generateMetadata({ params }: BlogPostProps) {
  const { id } = await Promise.resolve(params);
  const post = await getPostById(id)

  if (!post) {
    return {
      title: "記事が見つかりません",
    }
  }

  return {
    title: post.title,
    image: post.image,
  }
}

export default async function BlogPost({ params }: BlogPostProps) {
  // idから記事データを取得
  const { id } = await Promise.resolve(params);
  const post = await getPostById(id)

  // 記事が見つからない場合は404ページを表示
  if (!post) {
    notFound()
  }

  // すべての記事を取得して関連記事を探す
  const allPosts = await getSortedPostsData()

  // 関連記事を取得（同じタグを持つ他の記事）
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.tags?.some((tag) => post.tags?.includes(tag)))
    .slice(0, 2)

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/blog">
          <button className={styles.backButton}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            記事一覧に戻る
          </button>
        </Link>

        <article className={styles.article}>
          <div className={`${styles.meta} animate-fade-up`} style={{ animationDelay: "0.1s" }}>
            <div className={styles.date}>
              <Calendar className="h-4 w-4" />
              <time dateTime={post.date}>{format(new Date(post.date), "PPP", { locale: ja })}</time>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className={styles.tags}>
                <Tag className="h-4 w-4" />
                <div className={styles.tagList}>
                  {post.tags.map((tag) => (
                    <Link href={`/tags/${tag}`} key={tag} className={styles.tag}>
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* マークダウンから変換されたHTMLを表示するコンポーネント */}
          <div className={`animate-fade-up`} style={{ animationDelay: "0.2s", marginTop: "30px" }}>
            <MarkdownContent html={post.content} />
          </div>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              この記事が役に立ったら、
              <a
                href={`https://twitter.com/intent/tweet?url=https://yamada-blog.vercel.app/blog/${post.id}&text=${post.title}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerLink}
              >
                Xでシェア
              </a>
              していただけると嬉しいです。質問やフィードバックがあればお気軽にDMください。
            </p>
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <div className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>関連記事</h2>
            <div className={styles.relatedGrid}>
              {relatedPosts.map((related) => (
                <Link href={`/blog/${related.id}`} key={related.id} className={styles.relatedCard}>
                  <div className={styles.relatedCardInner}>
                    <h3 className={styles.relatedCardTitle}>{related.title}</h3>
                    {/* <p className={styles.relatedCardDescription}>{related.description || related.excerpt}</p> */}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

