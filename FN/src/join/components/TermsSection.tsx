import { STUDENT_TERMS, TEACHER_TERMS } from '../terms/content';
import { useJoinForm } from '../JoinFormProvider';
import JoinCheckboxField from './JoinCheckboxField';
import JoinSection from './JoinSection';
import TermsTextbox from './TermsTextbox';

export default function TermsSection() {
  const { state, fieldErrors, computed, actions } = useJoinForm();
  const isTeacher = state.role === 'TEACHER';
  const terms = isTeacher ? TEACHER_TERMS : STUDENT_TERMS;
  const sectionNumber = isTeacher ? '6' : computed.canShowGuardianSection ? '7' : '6';

  const setters = {
    agreeService: actions.setAgreeService,
    agreePrivacy: actions.setAgreePrivacy,
    agreeSensitive: actions.setAgreeSensitive,
  };

  return (
    <JoinSection title={`${sectionNumber}. 약관 동의`}>
      {terms.map((term) => (
        <div key={term.id} className="join-terms-item">
          <TermsTextbox id={`terms-${term.id}`} label={term.label} text={term.text} />

          <JoinCheckboxField
            id={term.errorKey}
            label={term.checkboxLabel}
            checked={state[term.checkedKey]}
            error={fieldErrors[term.errorKey]}
            onChange={setters[term.checkedKey]}
          />
        </div>
      ))}
    </JoinSection>
  );
}
