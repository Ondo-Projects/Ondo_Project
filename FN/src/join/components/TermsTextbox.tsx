interface TermsTextboxProps {
  id: string;
  label: string;
  text: string;
}

export default function TermsTextbox({ id, label, text }: TermsTextboxProps) {
  const textboxId = `${id}-text`;

  return (
    <div className="join-terms-block">
      <label className="join-terms-block__label" htmlFor={textboxId}>
        {label}
      </label>
      <textarea
        id={textboxId}
        className="join-terms-textbox"
        readOnly
        aria-readonly="true"
        rows={14}
        value={text}
        tabIndex={0}
      />
    </div>
  );
}
