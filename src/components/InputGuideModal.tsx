import { HelpCircle } from "lucide-react";

interface InputGuideModalProps {
  onClose: () => void;
  open: boolean;
}

export function InputGuideModal({ onClose, open }: InputGuideModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal guide-modal" role="dialog" aria-modal="true" aria-labelledby="input-guide-title">
        <div className="modal-icon confirm" aria-hidden="true">
          <HelpCircle size={28} />
        </div>
        <h2 id="input-guide-title">입력 설명서</h2>
        <ul className="guide-list">
          <li>숫자, +, -, *, /는 키보드로 입력합니다.</li>
          <li>*는 ×, /는 ÷로 들어갑니다.</li>
          <li>루트는 r, 팩토리얼은 f로 입력합니다.</li>
          <li>제출 기회는 팀별 5회입니다.</li>
          <li>제출 기록을 보고 선택 기록 수정으로 다시 불러올 수 있습니다.</li>
          <li>리더보드는 맞춘 개수 순, 동점이면 빠른 제출 순입니다.</li>
        </ul>
        <div className="modal-actions single-action">
          <button type="button" className="primary-action" onClick={onClose}>
            확인
          </button>
        </div>
      </section>
    </div>
  );
}
