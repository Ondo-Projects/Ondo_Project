import { Input } from '../../components/ui';

interface JoinCheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  error?: string;
  onChange: (checked: boolean) => void;
}

export default function JoinCheckboxField({
  id,
  label,
  checked,
  error,
  onChange,
}: JoinCheckboxFieldProps) {
  return (
    <>
      <label className="join-checkbox-row" htmlFor={id}>
        <Input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span>{label}</span>
      </label>
      {error ? (
        <p className="ui-field__error" role="alert">
          <span className="ui-field__error-icon" aria-hidden="true">
            !
          </span>
          <span>{error}</span>
        </p>
      ) : null}
    </>
  );
}
