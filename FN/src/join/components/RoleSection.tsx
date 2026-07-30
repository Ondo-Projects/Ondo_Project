import type { SignUpRole } from '../../api/types/signup';
import { useJoinForm } from '../JoinFormProvider';
import JoinSection from './JoinSection';

export default function RoleSection() {
  const { state, actions } = useJoinForm();

  function handleRoleChange(role: SignUpRole) {
    actions.setRole(role);
  }

  return (
    <JoinSection title="1. 가입 유형">
      <div className="join-role-group" role="radiogroup" aria-label="가입 유형">
        <label className="join-role-option">
          <input
            type="radio"
            name="role"
            value="STUDENT"
            checked={state.role === 'STUDENT'}
            onChange={() => handleRoleChange('STUDENT')}
          />
          학생
        </label>
        <label className="join-role-option">
          <input
            type="radio"
            name="role"
            value="TEACHER"
            checked={state.role === 'TEACHER'}
            onChange={() => handleRoleChange('TEACHER')}
          />
          교사
        </label>
      </div>
    </JoinSection>
  );
}
