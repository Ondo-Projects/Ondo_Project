import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import GuestRoute from '../auth/GuestRoute';
import RequireAuth from '../auth/RequireAuth';
import AdminPage from '../pages/AdminPage';
import FindIdPage from '../pages/FindIdPage';
import HomePage, { RootRedirect } from '../pages/HomePage';
import JoinPage from '../pages/JoinPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import RootPage from '../pages/RootPage';
import StudentPage from '../pages/StudentPage';
import TeacherPage from '../pages/TeacherPage';
import WithdrawPage from '../pages/WithdrawPage';
import { PATHS } from './paths';

/** 새 디자인 시스템 견본 — 개발 모드(npm run dev)에서만 /ui-preview 로 열림, 운영 빌드에는 포함 안 됨 */
const UiPreview = import.meta.env.DEV ? lazy(() => import('../v2/UiPreview')) : null;

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={PATHS.ROOT} element={<RootRedirect />} />
        <Route path="/landing" element={<RootPage />} />
        <Route
          path={PATHS.LOGIN}
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path={PATHS.JOIN}
          element={
            <GuestRoute>
              <JoinPage />
            </GuestRoute>
          }
        />
        <Route
          path={PATHS.FIND_ID}
          element={
            <GuestRoute>
              <FindIdPage />
            </GuestRoute>
          }
        />
        <Route
          path={PATHS.RESET_PASSWORD}
          element={
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path={PATHS.HOME}
          element={
            <RequireAuth roles={['STUDENT', 'TEACHER']}>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path={PATHS.STUDENT}
          element={
            <RequireAuth roles={['STUDENT']}>
              <StudentPage />
            </RequireAuth>
          }
        />
        <Route
          path={PATHS.TEACHER}
          element={
            <RequireAuth roles={['TEACHER']}>
              <TeacherPage />
            </RequireAuth>
          }
        />
        <Route
          path={PATHS.ADMIN}
          element={
            <RequireAuth roles={['ADMIN']}>
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route
          path={PATHS.WITHDRAW}
          element={
            <RequireAuth roles={['STUDENT', 'TEACHER']}>
              <WithdrawPage />
            </RequireAuth>
          }
        />
        {UiPreview ? (
          <Route
            path="/ui-preview"
            element={
              <Suspense fallback={null}>
                <UiPreview />
              </Suspense>
            }
          />
        ) : null}
        <Route path="/index.html" element={<Navigate to={PATHS.ROOT} replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
