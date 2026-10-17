export interface User {
  id: string;
  name: string;
  bio: string;
  interests: string[];
}

/** Directed edge: [fromUserId, toUserId] */
export type Edge = [string, string];
