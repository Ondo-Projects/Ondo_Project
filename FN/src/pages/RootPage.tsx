import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductTile from '../components/ProductTile.jsx';
import AppLayout from '../components/layout/AppLayout';
import { apiClient } from '../api/client';
import { PATHS } from '../routes/paths';
import './placeholder.css';

export default function RootPage() {
  const [proxyStatus, setProxyStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [proxyMessage, setProxyMessage] = useState('BN 서버(8081) 연결 확인 중…');

  useEffect(() => {
    let cancelled = false;

    apiClient<unknown>('/api/auth/me', { auth: false })
      .then(() => {
        if (!cancelled) {
          setProxyStatus('ok');
          setProxyMessage('API 프록시 연결 OK — /api/auth/me 응답 수신');
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const status =
          typeof error === 'object' && error !== null && 'status' in error
            ? Number((error as { status: unknown }).status)
            : null;

        if (status === 401 || status === 403) {
          setProxyStatus('ok');
          setProxyMessage('API 프록시 연결 OK — 인증 필요(401) 응답');
          return;
        }

        setProxyStatus('error');
        setProxyMessage('BN 서버에 연결하지 못했어요. Spring Boot(8081)를 실행해 주세요.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout>
      <section className="placeholder-page">
        <p className="placeholder-page__eyebrow">Issue #17-1 · React scaffold</p>
        <h1 className="placeholder-page__title">온도 React 앱</h1>
        <p className="placeholder-page__description">
          2026 UI/UX 디자인 가이드를 기준으로 FN 프론트엔드를 구축 중이에요.
        </p>

        <p
          className={`placeholder-page__status${
            proxyStatus === 'error' ? ' placeholder-page__status--error' : ''
          }`}
        >
          {proxyMessage}
        </p>

        <div className="placeholder-page__tiles">
          <ProductTile
            title="학생"
            description="담당 교사와 상담을 준비하고 이어갈 수 있어요."
            icon="🎒"
            badge={{ label: '준비 중', variant: 'student' }}
            size="wide"
            actions={[{ label: '학생 화면', variant: 'primary', href: PATHS.STUDENT }]}
          />
          <ProductTile
            title="교사"
            description="학생 상담 요청을 확인하고 답변할 수 있어요."
            icon="📋"
            badge={{ label: '준비 중', variant: 'teacher' }}
            actions={[{ label: '교사 화면', variant: 'primary', href: PATHS.TEACHER }]}
          />
        </div>

        <div className="placeholder-page__links">
          <Link className="placeholder-page__link" to={PATHS.LOGIN}>
            로그인
          </Link>
          <Link className="placeholder-page__link placeholder-page__link--ghost" to={PATHS.JOIN}>
            회원가입
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
