// placeholder projects -- swap in the real ones
export const projects = [
  { title: 'Project one', blurb: 'What it is in one line.', tags: ['web'] },
  { title: 'Project two', blurb: 'What it is in one line.', tags: ['ml', 'python'] },
  { title: 'Project three', blurb: 'What it is in one line.', tags: ['web', 'design'] },
];

export function allTags(list) {
  return [...new Set(list.flatMap((p) => p.tags))].sort();
}

// 'all' (or nothing) means no filter. unknown tags just give an empty list.
export function filterProjects(list, tag) {
  if (!tag || tag === 'all') return list;
  return list.filter((p) => p.tags.includes(tag));
}
