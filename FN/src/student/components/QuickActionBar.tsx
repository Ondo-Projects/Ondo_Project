import { STUDENT_QUICK_ACTIONS } from '../constants';
import { scrollToStudentSection } from '../studentUtils';

export default function QuickActionBar() {
  return (
    <nav className="student-quick-bar" aria-label="빠른 이동">
      {STUDENT_QUICK_ACTIONS.map((action) => (
        <button
          key={action.target}
          type="button"
          className="student-quick-bar__btn"
          onClick={() => scrollToStudentSection(action.target)}
        >
          {action.label}
        </button>
      ))}
    </nav>
  );
}
