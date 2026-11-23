import { ChevronDown } from 'lucide-react';
import { Checkbox } from '../../ds';
import { useJoinForm } from '../../join/JoinFormProvider';
import { STUDENT_TERMS, TEACHER_TERMS } from '../../join/terms/content';

/** 약관 전문 — 접어 두었다가 펼쳐 읽기 */
export function TermsText({ id, label, text }: { id: string; label: string; text: string }) {
  return (
    <details id={id} className="group rounded-md border border-gray-200">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[13px] text-gray-700 [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown
          size={16}
          className="shrink-0 text-gray-400 transition-transform duration-150 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div
        tabIndex={0}
        className="max-h-56 overflow-y-auto border-t border-gray-200 bg-gray-50/60 px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-gray-600"
      >
        {text}
      </div>
    </details>
  );
}

export function TermsBlock() {
  const { state, fieldErrors, actions } = useJoinForm();
  const terms = state.role === 'TEACHER' ? TEACHER_TERMS : STUDENT_TERMS;
  const setters = {
    agreeService: actions.setAgreeService,
    agreePrivacy: actions.setAgreePrivacy,
    agreeSensitive: actions.setAgreeSensitive,
  };
  const allChecked = terms.every((term) => state[term.checkedKey]);

  return (
    <div className="flex flex-col gap-3">
      <Checkbox
        checked={allChecked}
        onChange={(checked) => terms.forEach((term) => setters[term.checkedKey](checked))}
        className="rounded-md border border-gray-200 bg-gray-50/60 px-3 py-2.5 [&_label]:font-semibold"
      >
        아래 필수 약관에 모두 동의합니다.
      </Checkbox>
      {terms.map((term) => (
        <div key={term.id} className="flex flex-col gap-2">
          <Checkbox
            id={term.errorKey}
            checked={state[term.checkedKey]}
            onChange={setters[term.checkedKey]}
            error={fieldErrors[term.errorKey]}
          >
            {term.checkboxLabel}
          </Checkbox>
          <TermsText id={`terms-${term.id}`} label={term.label} text={term.text} />
        </div>
      ))}
    </div>
  );
}
