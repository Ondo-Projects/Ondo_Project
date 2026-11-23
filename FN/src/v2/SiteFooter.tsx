import { Link } from 'react-router-dom';
import { PATHS } from '../routes/paths';

/** 공개 화면(랜딩, 약관) 공통 바닥글 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <span>온도 · 중·고등학교 상담·학교생활 플랫폼</span>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="바닥글">
          <Link to={PATHS.TERMS} className="hover:text-white">
            이용약관
          </Link>
          <Link to={PATHS.PRIVACY} className="font-semibold text-white hover:underline">
            개인정보처리방침
          </Link>
          <Link to={PATHS.LOGIN} className="hover:text-white">
            로그인
          </Link>
          <Link to={PATHS.JOIN} className="hover:text-white">
            회원가입
          </Link>
          <Link to={PATHS.FIND_ID} className="hover:text-white">
            아이디 찾기
          </Link>
        </nav>
      </div>
    </footer>
  );
}
