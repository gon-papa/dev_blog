
import Link from "next/link";
import { getSelfInfo, SelfInfo } from "../_lib/self_introduction";
import styles from "../page.module.css"
import Image from "next/image"

export default function HeroSection() {
  const selfInfo: SelfInfo = getSelfInfo();

  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroContainer}`}>
        <div className={`${styles.heroContent} animate-fade-up`}>
          <h1 className={styles.heroTitle}>
            こんにちは、<span className={styles.heroTitleHighlight}>{selfInfo.name}</span>です
          </h1>
          <p className={styles.heroDescription}>
            {selfInfo.description}
          </p>
          <div className={styles.heroBadges}>
            {selfInfo.skill.map((skill, index) => (
              <span key={index} className={styles.badge}>
                {skill}
              </span>
            ))}
          </div>
          <div className={styles.heroActions}>
            <Link href="/about">
              <button className={`${styles.button} ${styles.buttonPrimary}`}>プロフィールを見る</button>
            </Link>
            <Link href="/blog">
              <button className={`${styles.button} ${styles.buttonOutline}`}>ブログ記事一覧</button>
            </Link>
          </div>
        </div>
        <div className={`${styles.heroImage} animate-fade-in`}>
          <div className={styles.profileImage}>
            <Image
              src={selfInfo.image_path}
              alt="ももんがのプロフィール画像"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}