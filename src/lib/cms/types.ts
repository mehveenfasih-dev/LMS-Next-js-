export type CMSAnnouncement = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  category: "Policy" | "Community" | "Collection" | "Hours";
  author: string;
  content: string;
};

export type CMSQueryResult<T> = {
  data: T;
  source: "sanity" | "contentful" | "payload" | "mdx";
  isDraft?: boolean;
};
