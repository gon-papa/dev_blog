import Image from "next/image"
import { Github, Calendar, MapPin, Briefcase } from "lucide-react"
import styles from "./page.module.css"
import { getSelfInfo, SelfInfo } from "../_lib/self_introduction"

export const metadata = {
  title: "プロフィール | ぺんじにあの部屋",
  description:
    "サーバーサイドペンジニア。経歴、スキル、プロジェクトについて紹介しています。",
}

export default function AboutPage() {
  const selfInfo: SelfInfo = getSelfInfo();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>プロフィール</h1>
        <p className={styles.subtitle}>サーバーサイドペンジニア</p>
      </div>

      <div className={styles.content}>
        <div className={styles.profileSection}>
          <div className={styles.profileImageContainer}>
            <div className={styles.profileImage}>
              <Image
                src={ selfInfo.image_path }
                alt="ぺんじにあのプロフィール画像"
                fill
                className="object-cover"
                priority
                sizes="100vm"
              />
            </div>
          </div>

          <div className={styles.profileInfo}>
            <h2 className={styles.name}>ぺんじにあ</h2>
            <p className={styles.bio}>
              サーバーサイド開発をメインにフロントエンド、アプリと開発しているWebペンジニアです。
              プロダクト開発に情熱を持っています。プロダクトに与えるインパクトを高めて、自分の開発がより多くの人の役に立ってもらえるような開発者を目指しています。
              このブログでは日々の開発で得た知見や発見、ぺんじにあの考えなどを発信しています。
            </p>

            <div className={styles.details}>
              <div className={styles.detailItem}>
                <MapPin className={styles.detailIcon} />
                <span>グンマー</span>
              </div>
              <div className={styles.detailItem}>
                <Briefcase className={styles.detailIcon} />
                <span>サーバーサイドペンジニア/PdM</span>
              </div>
              <div className={styles.detailItem}>
                <Calendar className={styles.detailIcon} />
                <span>2025年からブログ開設</span>
              </div>
            </div>

            <div className={styles.socialLinks}>
              <a
                href="https://github.com/gon-papa"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="GitHub"
              >
                <Github />
              </a>
              <a
                href="https://x.com/rom0323"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Twitter"
              >
                <Image src="/images/logo-black.png" alt="X icon" width={20} height={20} />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>スキル</h2>
          <div className={styles.skillsContainer}>
            <div className={styles.skillCategory}>
              <h3 className={styles.skillCategoryTitle}>フロントエンド</h3>
              <div className={styles.skills}>
                <span className={styles.skill}>JavaScript</span>
                <span className={styles.skill}>TypeScript</span>
                <span className={styles.skill}>React</span>
                <span className={styles.skill}>Next.js</span>
                <span className={styles.skill}>Vue.js</span>
              </div>
            </div>

            <div className={styles.skillCategory}>
              <h3 className={styles.skillCategoryTitle}>バックエンド</h3>
              <div className={styles.skills}>
                <span className={styles.skill}>PHP</span>
                <span className={styles.skill}>Laravel</span>
                <span className={styles.skill}>go</span>
                <span className={styles.skill}>Python</span>
                <span className={styles.skill}>FastAPI</span>
              </div>
            </div>

            <div className={styles.skillCategory}>
              <h3 className={styles.skillCategoryTitle}>ツール・その他</h3>
              <div className={styles.skills}>
                <span className={styles.skill}>Git</span>
                <span className={styles.skill}>GitHub</span>
                <span className={styles.skill}>Docker</span>
                <span className={styles.skill}>Figma</span>
                <span className={styles.skill}>AWS EC2</span>
                <span className={styles.skill}>AWS CloudFront</span>
                <span className={styles.skill}>AWS Aurora</span>
                <span className={styles.skill}>AWS Lambda</span>
                <span className={styles.skill}>Vercel</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>経歴</h2>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineDot}></div>
              <div className={styles.timelineContent}>
                <h3 className={styles.timelineTitle}>正社員</h3>
                <p className={styles.timelinePeriod}>2021年 - 現在</p>
                <p className={styles.timelineDescription}>
                  Webアプリケーション開発を中心に、自社開発プロダクトに従事しています。
                  サーバーサイドエンジニア兼プロダクトマネージャーとして開発組織のマネジメントも行っています。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>趣味・興味</h2>
          <p className={styles.paragraph}>
            基本的に何を作るか、プロダクト開発の参考書や情報収集など仕事が半分、趣味みたいになっています。
            それ以外は家族との時間を大切にしています！
          </p>
        </div>

        <div className={styles.contactSection}>
          <h2 className={styles.contactTitle}>お問い合わせ</h2>
          <p className={styles.contactDescription}>
            お仕事のご依頼やご質問などがありましたら、お気軽にご連絡ください。
          </p>
          <div className={styles.contactButtons}>
            <a href="https://x.com/rom0323" target="_blank" rel="noopener noreferrer">
              <button className={`button button-outline ${styles.contactButton}`}>
                <Image src="/images/logo-black.png" alt="X icon" width={14} height={14} />
                <span style={{ marginLeft: '8px' }}>DMはこちらのアカウントへ</span>     
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
