import { useJoinForm } from '../JoinFormProvider';
import JoinField from './JoinField';
import JoinSection from './JoinSection';

export default function ProfileNameSection() {
  const { state, fieldErrors, actions } = useJoinForm();
  const isTeacher = state.role === 'TEACHER';

  return (
    <JoinSection title={isTeacher ? '3. 교사 성명' : '3. 성명'}>
      <JoinField
        id="name"
        label={isTeacher ? '교사 성명' : '성명'}
        helper="담당 교사 등록 및 상담 안내에 사용됩니다."
        error={fieldErrors.name}
        required
      >
        <input
          type="text"
          name="name"
          maxLength={50}
          placeholder="실명을 입력해 주세요"
          value={state.name}
          onChange={(event) => actions.setName(event.target.value)}
        />
      </JoinField>
    </JoinSection>
  );
}
