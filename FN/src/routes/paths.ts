export const PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  JOIN: '/join',
  FIND_ID: '/find-id',
  RESET_PASSWORD: '/reset-password',
  WITHDRAW: '/withdraw',
  HOME: '/home',
  STUDENT: '/student',
  TEACHER: '/teacher',
  ADMIN: '/admin',
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];
