import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminPage from '../pages/AdminPage';
import HomePage from '../pages/HomePage';
import JoinPage from '../pages/JoinPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import RootPage from '../pages/RootPage';
import StudentPage from '../pages/StudentPage';
import TeacherPage from '../pages/TeacherPage';
import { PATHS } from './paths';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={PATHS.ROOT} element={<RootPage />} />
        <Route path={PATHS.LOGIN} element={<LoginPage />} />
        <Route path={PATHS.JOIN} element={<JoinPage />} />
        <Route path={PATHS.HOME} element={<HomePage />} />
        <Route path={PATHS.STUDENT} element={<StudentPage />} />
        <Route path={PATHS.TEACHER} element={<TeacherPage />} />
        <Route path={PATHS.ADMIN} element={<AdminPage />} />
        <Route path="/index.html" element={<Navigate to={PATHS.ROOT} replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
