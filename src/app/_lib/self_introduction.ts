import path from "path"
import fs from 'fs';
import matter from "gray-matter";


export interface SelfInfo {
  name: string,
  image_path: string,
  description: string,
  skill: string[]
}

const selfIntroductionDir = path.join(process.cwd(), 'self_introduction')

export function getSelfInfo(): SelfInfo {
  const file = fs.readdirSync(selfIntroductionDir);
  const filePath = path.join(selfIntroductionDir, file[0]);

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const matterResult = matter(fileContents);

  const data = matterResult.data as SelfInfo;
  return data;
}