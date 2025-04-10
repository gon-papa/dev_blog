import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { PostData } from './types/post';
import { remark } from 'remark';
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";
import { v4 as uuidv4 } from 'uuid';

type PostMatter = Pick<PostData, "title" | "date" | "tags" | "image">;

// 記事保管トップレベルディレクトリ
const postRootDir = path.join(process.cwd(), 'posts');

// idチェックで、マターにidがない場合はuuidを付与
function ensurePostDataHasId(fullPath: string, content: string, data: Partial<PostData>): string {
  if (!data.id) {
    const newId = uuidv4();

    // 新しいfront matterとコンテンツを結合してファイル内容を更新
    const orderedData = { id: newId, ...data };

    const updatedFileContents = matter.stringify(content, orderedData);
    fs.writeFileSync(fullPath, updatedFileContents, 'utf8');

    return newId;
  }
  return data.id;
}

// マターの抜けチェック
function isValidMatter(data: unknown, fullPath: string): void {
  // unkownによる型ガード
  if (!data || typeof data !== 'object') {
    throw new Error(`Error processing file ${fullPath}: front matter が存在しないか無効です。`);
  }

  const d = data as Partial<PostMatter>;
  if (typeof d.title !== 'string' || typeof d.date !== 'string') {
    throw new Error(`Error processing file ${fullPath}: front matter に title または date が存在しません。`);
  }
  if (d.title.trim() === "" || d.date.trim() === "") {
    throw new Error(`Error processing file ${fullPath}: front matter に空文字があります。`);
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

      postData.id = ensurePostDataHasId(fullPath, content, postData);// idが存在しない場合はUUID生成し、ファイルに追記
      postData.path = repPath;
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

// idから特定の記事を取得する関数
export async function getPostById(id: string): Promise<PostData | null> {
  try {
    const blogs = await getSortedPostsData();
    const blog = blogs.find((post) => post.id === id);
    if (!blog) {
      return null
    }

    const fullPath = path.join(postRootDir, `${blog.path}.md`)

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
      id: data.id,
      title: data.title,
      date: data.date,
      tags: data.tags || [],
      image: data.image,
      content: contentHtml,
      path: repPath
    }
  } catch (error) {
    console.error(`Error getting post by id: ${id}`, error)
    return null
  }
}