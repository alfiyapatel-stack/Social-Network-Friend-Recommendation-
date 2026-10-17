import type { Edge, User } from './types';

export const SAMPLE_USERS: User[] = [
  { id: 'u0', name: 'Aisha', bio: 'Street photographer chasing golden-hour light.', interests: ['Photography', 'Travel', 'Art'] },
  { id: 'u1', name: 'Rohan', bio: 'Full-stack tinkerer who streams indie games.', interests: ['Coding', 'Gaming', 'Music'] },
  { id: 'u2', name: 'Meera', bio: 'Bookworm and watercolour doodler.', interests: ['Reading', 'Art', 'Photography'] },
  { id: 'u3', name: 'Kabir', bio: 'Open-source contributor, weekend cricketer.', interests: ['Coding', 'Sports', 'Gaming'] },
  { id: 'u4', name: 'Zoya', bio: 'Indie-folk singer and backpacking enthusiast.', interests: ['Music', 'Travel', 'Art'] },
  { id: 'u5', name: 'Arjun', bio: 'Speedruns retro games between hackathons.', interests: ['Gaming', 'Coding', 'Sports'] },
  { id: 'u6', name: 'Diya', bio: 'Travel journals and film photography.', interests: ['Photography', 'Reading', 'Travel'] },
  { id: 'u7', name: 'Ishaan', bio: 'Trekking, football and good playlists.', interests: ['Sports', 'Travel', 'Music'] },
  { id: 'u8', name: 'Nisha', bio: 'Illustrator who sketches to lo-fi beats.', interests: ['Art', 'Music', 'Reading'] },
  { id: 'u9', name: 'Vikram', bio: 'Algorithms nerd, fantasy-novel collector.', interests: ['Coding', 'Gaming', 'Reading'] },
  { id: 'u10', name: 'Sara', bio: 'Marathon runner exploring new cities.', interests: ['Sports', 'Travel', 'Photography'] },
  { id: 'u11', name: 'Tara', bio: 'Piano, poetry nights and gallery visits.', interests: ['Music', 'Art', 'Reading'] },
  { id: 'u12', name: 'Yash', bio: 'New in town — loves football and co-op games.', interests: ['Gaming', 'Sports', 'Coding'] },
  { id: 'u13', name: 'Leela', bio: 'Portrait photographer and mural fan.', interests: ['Photography', 'Art', 'Travel'] },
  { id: 'u14', name: 'Omar', bio: 'Quiet reader who codes side projects at night.', interests: ['Reading', 'Coding', 'Music'] },
];

// Friendships are mutual in the sample: each pair becomes two reciprocal directed edges.
const PAIRS: [number, number][] = [
  // creative cluster
  [0, 2], [0, 4], [0, 6], [0, 13], [2, 6], [2, 8], [4, 8], [4, 11], [8, 11], [6, 13],
  // tech / sports cluster
  [1, 3], [1, 5], [1, 9], [3, 5], [3, 9], [5, 9], [5, 7], [3, 7], [7, 10], [7, 12],
  // bridges between the clusters
  [4, 7], [9, 11],
];

export const SAMPLE_EDGES: Edge[] = PAIRS.flatMap(
  ([a, b]) => [[`u${a}`, `u${b}`], [`u${b}`, `u${a}`]] as Edge[],
);
