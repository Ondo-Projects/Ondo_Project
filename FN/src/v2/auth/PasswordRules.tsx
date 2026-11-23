import { Check, Circle } from 'lucide-react';
import { cn } from '../../ds';

/** 비밀번호 규칙 — BN 비밀번호 정책과 같게 (joinValidation.validatePassword) */
export function getPasswordRuleChecks(password: string, username: string) {
  return [
    { id: 'length', label: '8~100자', valid: password.length >= 8 && password.length <= 100 },
    { id: 'letter', label: '영문', valid: /[A-Za-z]/.test(password) },
    { id: 'digit', label: '숫자', valid: /[0-9]/.test(password) },
    { id: 'special', label: '특수문자', valid: /[!@#$%^&*(),.?":{}|[\]\-_=+;'/`~\\]/.test(password) },
    { id: 'noSpace', label: '공백 없음', valid: password.length > 0 && !password.includes(' ') },
    {
      id: 'notUsername',
      label: '아이디와 다름',
      valid: password.length > 0 && (!username.trim() || password.toLowerCase() !== username.trim().toLowerCase()),
    },
  ];
}

export function PasswordRules({ password, username }: { password: string; username: string }) {
  const rules = getPasswordRuleChecks(password, username);
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label="비밀번호 규칙">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={cn('flex items-center gap-1 text-xs', rule.valid ? 'text-emerald-700' : 'text-gray-400')}
        >
          {rule.valid ? <Check size={14} aria-hidden /> : <Circle size={10} aria-hidden className="mx-0.5" />}
          {rule.label}
          <span className="sr-only">{rule.valid ? '충족' : '미충족'}</span>
        </li>
      ))}
    </ul>
  );
}
