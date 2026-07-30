import type { ReactNode } from 'react';
import type {
  SchoolScheduleUpcomingResponse,
  WeatherTodayResponse,
} from '../../api/types/home';
import { ScheduleSummary, WeatherWidget } from './CommonStripWidgets';

interface SchoolTodayStripProps {
  todayLabel: string;
  schoolMeta: string;
  isLoading: boolean;
  weather: WeatherTodayResponse | null;
  weatherError: string | null;
  schedule: SchoolScheduleUpcomingResponse | null;
  scheduleError: string | null;
}

export default function SchoolTodayStrip({
  todayLabel,
  schoolMeta,
  isLoading,
  weather,
  weatherError,
  schedule,
  scheduleError,
}: SchoolTodayStripProps) {
  return (
    <section className="home-common-strip" aria-label="오늘의 학교 정보">
      <div className="home-common-strip__hero">
        <div className="home-common-strip__intro">
          <span className="home-common-strip__badge">TODAY</span>
          <h2 className="home-common-strip__headline">오늘의 학교 정보</h2>
          <p className="home-common-strip__lead">
            학생과 교사가 함께 보는 날짜, 날씨, 학사일정을 한눈에 확인해요.
          </p>
        </div>

        <div className="home-common-strip__facts">
          <article className="home-common-strip__fact">
            <span className="home-common-strip__fact-icon" aria-hidden="true">
              📅
            </span>
            <div className="home-common-strip__fact-body">
              <p className="home-common-strip__fact-label">오늘 날짜</p>
              <p className="home-common-strip__fact-value">{todayLabel}</p>
            </div>
          </article>

          <article className="home-common-strip__fact">
            <span className="home-common-strip__fact-icon" aria-hidden="true">
              🏫
            </span>
            <div className="home-common-strip__fact-body">
              <p className="home-common-strip__fact-label">우리 학교</p>
              <p className="home-common-strip__fact-value">
                {isLoading ? '불러오는 중…' : schoolMeta}
              </p>
            </div>
          </article>
        </div>
      </div>

      <div className="home-common-strip__panels">
        <PanelCard
          title="오늘의 날씨"
          icon="🌤️"
          tone="weather"
        >
          <WeatherWidget data={weather} error={weatherError} />
        </PanelCard>

        <PanelCard
          title="다가오는 학사일정"
          icon="📚"
          tone="schedule"
        >
          <ScheduleSummary data={schedule} error={scheduleError} />
        </PanelCard>
      </div>
    </section>
  );
}

function PanelCard({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: string;
  tone: 'weather' | 'schedule';
  children: ReactNode;
}) {
  return (
    <article className={`home-common-strip__panel home-common-strip__panel--${tone}`}>
      <div className="home-common-strip__panel-head">
        <span className="home-common-strip__panel-icon" aria-hidden="true">
          {icon}
        </span>
        <h3 className="home-common-strip__panel-title">{title}</h3>
      </div>
      <div className="home-common-strip__panel-body">{children}</div>
    </article>
  );
}
