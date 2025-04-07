import styles from "./page.module.css"
import HeroSection from "./_components/hero"
import BlogSection from "./_components/blogs"
import ProjectSection from "./_components/projects"
import ContactSection from "./_components/contact"

export default async function Home() {
  return (
    <div className={styles.main}>
      {/* ヒーローセクション */}
      <HeroSection />

      {/* 最新記事セクション */}
      <BlogSection />

      {/* プロジェクトセクション */}
      <ProjectSection />

      {/* お問い合わせセクション */}
      <ContactSection />
    </div>
  )
}

