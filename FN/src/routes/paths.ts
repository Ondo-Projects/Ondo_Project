export const PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  JOIN: '/join',
  HOME: '/home',
  STUDENT: '/student',
  TEACHER: '/teacher',
  ADMIN: '/admin',
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];
