import { STUDENT_QUICK_ACTIONS } from '../constants';

interface QuickActionBarProps {
  onNavigate: (sectionId: string) => void;
}

export default function QuickActionBar({ onNavigate }: QuickActionBarProps) {
  return (
    <nav className="student-quick-bar" aria-label="빠른 이동">
      {STUDENT_QUICK_ACTIONS.map((action) => (
        <button
          key={action.target}
          type="button"
          className="student-quick-bar__btn"
          onClick={() => onNavigate(action.target)}
        >
          {action.label}
        </button>
      ))}
    </nav>
  );
}
