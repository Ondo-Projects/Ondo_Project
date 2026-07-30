import { useJoinForm } from '../JoinFormProvider';
import JoinSection from './JoinSection';

const STUDENT_TERMS = [
  {
    id: 'service',
    summary: '서비스 이용약관',
    body: '온도 상담 서비스 이용 조건, 회원의 권리·의무, 서비스 변경 및 중단 등 기본 이용 규칙을 안내합니다.',
    label: '[필수] 서비스 이용약관 동의',
    checkedKey: 'agreeService' as const,
    errorKey: 'agreeService' as const,
  },
  {
    id: 'privacy',
    summary: '개인정보 수집 및 이용',
    body: '상담 서비스 제공을 위해 필요한 최소한의 개인정보를 수집·이용하며, 보관 기간과 파기 절차를 안내합니다.',
    label: '[필수] 개인정보 수집 및 이용 동의',
    checkedKey: 'agreePrivacy' as const,
    errorKey: 'agreePrivacy' as const,
  },
  {
    id: 'sensitive',
    summary: '민감정보(상담 내용) 수집 및 이용',
    body: '상담 내용 등 민감정보를 안전하게 보관·이용하기 위한 목적과 보호 조치를 안내합니다.',
    label: '[필수] 민감정보(상담 내용) 수집 및 이용 동의',
    checkedKey: 'agreeSensitive' as const,
    errorKey: 'agreeSensitive' as const,
  },
];

const TEACHER_TERMS = [
  {
    id: 'service',
    summary: '서비스 이용약관',
    body: '교사 계정의 상담 관리 기능 이용 조건과 책임 사항을 안내합니다.',
    label: '[필수] 서비스 이용약관 동의',
    checkedKey: 'agreeService' as const,
    errorKey: 'agreeService' as const,
  },
  {
    id: 'privacy',
    summary: '개인정보 수집 및 이용',
    body: '교사 계정 운영과 상담 관리를 위해 필요한 개인정보 수집·이용 항목을 안내합니다.',
    label: '[필수] 개인정보 수집 및 이용 동의',
    checkedKey: 'agreePrivacy' as const,
    errorKey: 'agreePrivacy' as const,
  },
  {
    id: 'sensitive',
    summary: '학생 민감정보 처리 및 비밀유지',
    body: '학생 상담 정보의 비밀유지 의무와 안전한 처리 원칙을 안내합니다.',
    label: '[필수] 학생 민감정보 처리 및 비밀유지 의무 동의',
    checkedKey: 'agreeSensitive' as const,
    errorKey: 'agreeSensitive' as const,
  },
];

export default function TermsSection() {
  const { state, fieldErrors, computed, actions } = useJoinForm();
  const isTeacher = state.role === 'TEACHER';
  const terms = isTeacher ? TEACHER_TERMS : STUDENT_TERMS;
  const sectionNumber =
    isTeacher ? '6' : computed.canShowGuardianSection ? '7' : '6';

  const setters = {
    agreeService: actions.setAgreeService,
    agreePrivacy: actions.setAgreePrivacy,
    agreeSensitive: actions.setAgreeSensitive,
  };

  return (
    <JoinSection title={`${sectionNumber}. 약관 동의`}>
      {terms.map((term) => (
        <div key={term.id} className="join-terms-item">
          <details>
            <summary>{term.summary}</summary>
            <div className="join-terms-item__body">{term.body}</div>
          </details>

          <label className="join-checkbox-row">
            <input
              id={term.errorKey}
              type="checkbox"
              checked={state[term.checkedKey]}
              onChange={(event) => setters[term.checkedKey](event.target.checked)}
            />
            <span>{term.label}</span>
          </label>

          {fieldErrors[term.errorKey] ? (
            <p className="join-field__error" role="alert">
              <span className="join-field__error-icon" aria-hidden="true">
                !
              </span>
              <span>{fieldErrors[term.errorKey]}</span>
            </p>
          ) : null}
        </div>
      ))}
    </JoinSection>
  );
}
