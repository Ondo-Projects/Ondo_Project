import { JoinFormProvider } from '../join/JoinFormProvider';
import PlaceholderPage from './PlaceholderPage';

export default function JoinPage() {
  return (
    <JoinFormProvider>
      <PlaceholderPage
        eyebrow="공개 · #17-4 진행 중"
        title="회원가입"
        description="폼 상태·로직(2단계) 준비 완료. 다음 단계에서 UI 섹션을 연결할 예정이에요."
      />
    </JoinFormProvider>
  );
}
