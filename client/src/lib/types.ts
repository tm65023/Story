export interface Entry {
  id: number;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  updatedAt: string;
  entryTags: {
    tag: {
      id: number;
      name: string;
    };
  }[];
}

export interface Tag {
  id: number;
  name: string;
}
