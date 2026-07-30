import { TEACHER_QUICK_ACTIONS } from '../constants';

interface QuickActionBarProps {
  onNavigate: (sectionId: string) => void;
}

export default function QuickActionBar({ onNavigate }: QuickActionBarProps) {
  return (
    <nav className="teacher-quick-bar" aria-label="빠른 이동">
      {TEACHER_QUICK_ACTIONS.map((action) => (
        <button
          key={action.target}
          type="button"
          className="teacher-quick-bar__btn"
          onClick={() => onNavigate(action.target)}
        >
          {action.label}
        </button>
      ))}
    </nav>
  );
}
