// lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { PostData } from './types/post';

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
export function getSortedPostsData(): PostData[] {
    // postsディレクトリ以下の全Markdownファイルのパスを取得
    const filePaths = getAllMarkdownFiles(postRootDir);
    const allPostsData: PostData[] = filePaths.map((fullPath) => {
      // postsディレクトリからの相対パスを記事IDとして利用（例: "posts/hoge/post"）
      const relativePath = path.relative(postRootDir, fullPath);
      // 拡張子除去
      const id = relativePath.replace(/\.md$/, '');
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      // マター読み込み
      const matterResult = matter(fileContents);

      isValidMatter(matterResult.data, fullPath)
  
      const data = matterResult.data as PostData;
      data.id = id
  
      return data
    });
  // 日付で降順にソートして返す
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}