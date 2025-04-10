import Link from "next/link"

export default function NotFound() {
  return (
    <div className="not-found">
      <h2 className="text-5xl font-bold mb-6">404</h2>
      <p className="text-xl text-muted-foreground mb-8">お探しのページは見つかりませんでした。</p>
      <Link href="/">
        <button className="button button-primary">ホームに戻る</button>
      </Link>
    </div>
  )
}
