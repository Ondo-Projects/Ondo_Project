import { CardHelper } from '../../components/ui';
import { useJoinForm } from '../JoinFormProvider';
import JoinSection from './JoinSection';
import TeacherEmailVerificationBlock from './TeacherEmailVerificationBlock';

export default function TeacherEmailSection() {
  const { state } = useJoinForm();

  if (state.role !== 'TEACHER') {
    return null;
  }

  return (
    <JoinSection title="4. 교사 이메일 인증">
      <CardHelper>
        교사 가입은 시·도교육청 공직 메일(@sen.go.kr, @goe.go.kr 등) 또는 @korea.kr 인증이
        필요합니다.
      </CardHelper>

      <TeacherEmailVerificationBlock />
    </JoinSection>
  );
}
