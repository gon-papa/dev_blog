// lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { PostData } from './types/post';
import { remark } from 'remark';
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";
import Image from 'next/image';
import { randomUUID } from 'crypto';

// 記事保管トップレベルディレクトリ
const postRootDir = path.join(process.cwd(), 'posts');

// マターの抜けチェック
function isValidMatter(data: any, fullPath: string): void {
    if(!data || typeof data.title != 'string' || typeof data.date != 'string') {
        throw new Error(`Error processing file ${fullPath}: マターが抜けています。`);
    }

    if (data.title === "" || data.date === "" ) {
        throw new Error(`Error processing file ${fullPath}: マターに空文字が含まれています。`);
    }
}

// 再起的に記事保管ディレクトリ配下のファイルを全て取得する
function getAllMarkdownFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        results = results.concat(getAllMarkdownFiles(filePath));
      } else if (file.endsWith('.md')) {
        results.push(filePath);
      }
    });
    return results;
  }


// 記事取得ヘルパー
export async function getSortedPostsData(): Promise<PostData[]> {
    // postsディレクトリ以下の全Markdownファイルのパスを取得
    const filePaths = getAllMarkdownFiles(postRootDir);
    const allPostsData: PostData[] = await Promise.all(
      filePaths.map(async (fullPath) => {
      // postsディレクトリからの相対パスを記事IDとして利用（例: "posts/hoge/post"）
      const relativePath = path.relative(postRootDir, fullPath);
      // 拡張子除去
      const repPath = relativePath.replace(/\.md$/, '');
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      // マター読み込み
      const { data, content } = matter(fileContents);

      isValidMatter(data, fullPath)
  
      const postData = data as PostData;
      postData.id = repPath;
      postData.content = await markdownToHtml(content);
  
      return postData;
    })
  );
  // 日付で降順にソートして返す
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function markdownToHtml(md: string): Promise<string> {
  const result = await remark()
                        .use(remarkGfm)
                        .use(remarkRehype, { allowDangerousHtml: true })
                        .use(rehypeStringify, { allowDangerousHtml: true })
                        .use(rehypePrettyCode)
                        .process(md)
  return result.toString();
}

// スラッグから特定の記事を取得する関数
export async function getPostById(id: string): Promise<PostData | null> {
  try {
    const fullPath = path.join(postRootDir, `${id}.md`)

    // ファイルが存在しない場合はnullを返す
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, "utf8")
    // postsディレクトリからの相対パスを記事IDとして利用（例: "posts/hoge/post"）
    const relativePath = path.relative(postRootDir, fullPath);
    // 拡張子除去
    const repPath = relativePath.replace(/\.md$/, '');

    // gray-matterを使用してフロントマターと本文を分離
    const { data, content } = matter(fileContents)

    // マークダウンをHTMLに変換
    const contentHtml = await markdownToHtml(content)

    // 記事のメタデータと内容を返す
    return {
      id: repPath,
      title: data.title,
      date: data.date,
      tags: data.tags || [],
      image: data.image,
      content: contentHtml,
    }
  } catch (error) {
    console.error(`Error getting post by slug: ${id}`, error)
    return null
  }
}