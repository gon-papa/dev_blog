"use client"

import { useEffect, useRef } from "react"
import styles from "./markdown-content.module.css"

interface MarkdownContentProps {
  html: string
}

export default function MarkdownContent({ html }: MarkdownContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // コードブロック内のリンクに対して新しいタブで開くように設定
    if (contentRef.current) {
      const links = contentRef.current.querySelectorAll("a")
      links.forEach((link) => {
        // 外部リンクの場合は新しいタブで開く
        if (link.hostname !== window.location.hostname) {
          link.setAttribute("target", "_blank")
          link.setAttribute("rel", "noopener noreferrer")
        }
      })
    }
  }, [html])

  return <div ref={contentRef} className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: html }} />
}

