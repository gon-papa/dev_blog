// app/page.tsx
import { getSortedPostsData } from './_lib/post';
import { PostData } from './_lib/types/post'

// export const dynamic = 'force-static';

export default async function Home() {
  const allPostsData: PostData[] = getSortedPostsData();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>ブログ記事一覧</h1>
      <ul>
        {allPostsData.map(({ id, title, date, tags }) => (
          <li key={id} style={{ marginBottom: '1rem' }}>
            <a href={`/posts/${id}`} style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {title}
            </a>
            <br />
            <small>{date}</small>
            {tags && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
                タグ: {tags.join(', ')}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}