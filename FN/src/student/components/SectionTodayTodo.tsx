import type { TodayTodoItem } from '../studentTodayTodo';

interface SectionTodayTodoProps {
  items: TodayTodoItem[];
  onNavigate: (sectionId: string) => void;
}

export default function SectionTodayTodo({ items, onNavigate }: SectionTodayTodoProps) {
  return (
    <section className="student-card" aria-labelledby="student-today-todo-title">
      <h2 id="student-today-todo-title" className="student-card__title">
        오늘 할 일
      </h2>
      <p className="student-card__helper">탭하면 해당 메뉴로 이동합니다.</p>
      <div className="student-today-todo-list">
        {items.map((item) => (
          <button
            key={`${item.label}-${item.target}`}
            type="button"
            className={`student-today-todo-item${item.tone ? ` student-today-todo-item--${item.tone}` : ''}`}
            disabled={item.disabled}
            onClick={() => onNavigate(item.target)}
          >
            <span className="student-today-todo-item__label">{item.label}</span>
            <span className="student-today-todo-item__status">{item.status}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
