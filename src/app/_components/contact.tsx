
import styles from "../page.module.css"
import Image from "next/image";

export default function ContactSection() {
  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.contactSection}>
        <div className={styles.contactContent}>
          <div className={styles.contactInfo}>
            <h2 className={styles.contactTitle}>お問い合わせ</h2>
            <p className={styles.contactDescription}>ご質問など、お気軽にお問い合わせください。</p>
          </div>
          <div className={styles.contactActions}>
            <a href="https://twitter.com/yamada-taro" target="_blank" rel="noopener noreferrer">
              <button className={`${styles.button} ${styles.buttonOutline}`}>
                <Image src="/images/logo-black.png" alt="X icon" width={14} height={14} />              
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}