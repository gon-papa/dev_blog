export interface PostData {
    id: string;
    title: string;
    date: string;
    tags?: string[];
    image: string;
    content: string;
    path?: string;
  };