import { Card } from '../../components/ui';
import type { TodayTodoItem } from '../studentTodayTodo';

interface SectionTodayTodoProps {
  items: TodayTodoItem[];
  onNavigate: (sectionId: string) => void;
}

export default function SectionTodayTodo({ items, onNavigate }: SectionTodayTodoProps) {
  return (
    <Card
      title="오늘 할 일"
      titleId="student-today-todo-title"
      helper="항목을 누르면 해당 메뉴로 이동합니다."
      titleMark
      aria-labelledby="student-today-todo-title"
    >
      <div className="student-today-todo-list" role="list">
        {items.map((item) => (
          <button
            key={`${item.label}-${item.target}`}
            type="button"
            role="listitem"
            className={`student-today-todo-item${item.tone ? ` student-today-todo-item--${item.tone}` : ''}`}
            disabled={item.disabled}
            onClick={() => onNavigate(item.target)}
          >
            <span className="student-today-todo-item__label">{item.label}</span>
            <span className="student-today-todo-item__status">{item.status}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
