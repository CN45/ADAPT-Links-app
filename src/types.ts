export type LinkStatus = "active" | "needs-review" | "archived";

export type ResourceLink = {
  title: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
  addedBy: string;
  dateAdded: string;
  recommended: boolean;
  status: LinkStatus;
};

export type SortKey = "recommended" | "newest" | "title" | "category";
