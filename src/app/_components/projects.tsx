import Link from "next/link";
import styles from "../page.module.css"
import { ArrowRight, Code, Github } from "lucide-react"

export default function ProjectSection() {
  return (
    <section className={`container ${styles.projectsSection}`}>
      <div className="text-center mb-10">
        <h2 className={styles.sectionTitle}>個人プロジェクト</h2>
        <p className={styles.sectionDescription}>私が趣味や学習のために開発しているプロジェクトをご紹介します</p>
      </div>

      <div className={styles.cardGrid}>
        <div className={styles.projectCard}>
          <div className={styles.projectHeader}>
            <div className={styles.projectMeta}>
              <Code className={`h-5 w-5 ${styles.projectIcon}`} />
              <span className={styles.projectBadge}>comming soon</span>
            </div>
            <h3 className={styles.projectTitle}>Comming Soon</h3>
            <p className={styles.projectDescription}>更新予定</p>
          </div>
          <div className={styles.projectContent}>
            <p className={styles.projectText}>
             
            </p>
          </div>
          <div className={styles.projectFooter}>
            <div className={styles.projectTags}>
              {/* <span className={styles.badge}>React</span> */}
              {/* <span className={styles.badge}>TypeScript</span> */}
            </div>
            {/* <a
              href="https://github.com/yamada-taro/react-components"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.projectLink}
            > */}
              <Github className="h-4 w-4" />
              {/* GitHub
            </a> */}
          </div>
        </div>
      </div>

      <div className={styles.sectionActions}>
        {/* <Link href="/projects"> */}
          <button className={`${styles.button} ${styles.buttonOutline}`}>
            {/* すべてのプロジェクトを見る */}
            comming soon
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        {/* </Link> */}
      </div>
    </section>
  );
}