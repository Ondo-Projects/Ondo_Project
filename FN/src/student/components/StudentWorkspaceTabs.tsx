import type { StudentWorkspaceTab } from '../counselingLabels';

interface StudentWorkspaceTabsProps {
  activeTab: StudentWorkspaceTab;
  onChange: (tab: StudentWorkspaceTab) => void;
}

export default function StudentWorkspaceTabs({ activeTab, onChange }: StudentWorkspaceTabsProps) {
  return (
    <div className="student-workspace-tabs" role="tablist" aria-label="상담 메뉴">
      <button
        type="button"
        role="tab"
        className={`student-workspace-tabs__btn${activeTab === 'pre-counsel' ? ' is-active' : ''}`}
        aria-selected={activeTab === 'pre-counsel'}
        onClick={() => onChange('pre-counsel')}
      >
        사전카드
      </button>
      <button
        type="button"
        role="tab"
        className={`student-workspace-tabs__btn${activeTab === 'counsel-create' ? ' is-active' : ''}`}
        aria-selected={activeTab === 'counsel-create'}
        onClick={() => onChange('counsel-create')}
      >
        상담 신청
      </button>
      <button
        type="button"
        role="tab"
        className={`student-workspace-tabs__btn${activeTab === 'counsel-list' ? ' is-active' : ''}`}
        aria-selected={activeTab === 'counsel-list'}
        onClick={() => onChange('counsel-list')}
      >
        내 상담
      </button>
    </div>
  );
}
