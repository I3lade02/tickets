export const STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'open', label: 'In progress' },
  { id: 'waiting', label: 'Waiting on reply' },
  { id: 'closed', label: 'Closed' },
];

export const PRIORITIES = [
  { id: 'urgent', label: 'Urgent', rank: 0 },
  { id: 'high', label: 'High', rank: 1 },
  { id: 'normal', label: 'Normal', rank: 2 },
  { id: 'low', label: 'Low', rank: 3 },
];

export const LIMITS = { name: 120, email: 200, subject: 200, message: 10000, note: 10000 };

export const isStatus = (id) => STATUSES.some((s) => s.id === id);
export const isPriority = (id) => PRIORITIES.some((p) => p.id === id);
export const statusLabel = (id) => STATUSES.find((s) => s.id === id)?.label ?? id;
export const priorityLabel = (id) => PRIORITIES.find((p) => p.id === id)?.label ?? id;
export const priorityRank = (id) => PRIORITIES.find((p) => p.id === id)?.rank ?? 2;
