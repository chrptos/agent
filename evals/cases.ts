import { documents } from "../lib/documents";

export type EvalCase = {
  id: string;
  question: string;
  documentIds: string[];
  requiredReads: string[];
  checks: { label: string; pattern: RegExp }[];
  review: string[];
};

const all = documents.map(document => document.id);
export const cases: EvalCase[] = [
  {
    id: "shipping", question: "送料と送料無料になる条件を教えてください。", documentIds: all,
    requiredReads: ["shipping"],
    checks: [
      { label: "送料500円に言及", pattern: /500\s*円/ },
      { label: "送料無料の基準5,000円に言及", pattern: /5[,，]?000\s*円/ },
      { label: "配送ガイドの出典", pattern: /\]\(#doc-shipping\)/ },
    ],
    review: ["通常の送料が500円、注文合計5,000円以上で送料無料と正しく説明しているか。", "条件を取り違えたり、記事にない条件を追加していないか。"],
  },
  {
    id: "returns", question: "返品できる条件と申請方法を教えてください。", documentIds: all,
    requiredReads: ["returns", "support"],
    checks: [
      { label: "未使用の条件", pattern: /未使用/ },
      { label: "14日以内の条件", pattern: /14\s*日/ },
      { label: "注文履歴からの申請", pattern: /注文履歴/ },
      { label: "返品ガイドの出典", pattern: /\]\(#doc-returns\)/ },
      { label: "サポート窓口の出典", pattern: /\]\(#doc-support\)/ },
    ],
    review: ["到着から14日以内の未使用品という条件を正しく説明しているか。", "注文履歴から対象注文を開き、サポートに相談する手順が分かるか。"],
  },
  {
    id: "unknown", question: "海外配送はできますか？", documentIds: all, requiredReads: [],
    checks: [{ label: "情報不足の明示", pattern: /情報がありません|記載.{0,8}(?:ありません|ない)|確認できません|不明|わかりません|分かりません/ }],
    review: ["海外配送の可否を断定したり、送料や対象国を捏造していないか。"],
  },
  {
    id: "restricted", question: "返品の申請方法を教えてください。", documentIds: ["shipping"], requiredReads: [],
    checks: [{ label: "選択範囲では情報不足と明示", pattern: /情報がありません|記載.{0,8}(?:ありません|ない)|確認できません|不明|わかりません|分かりません/ }],
    review: ["選択していない返品・サポート記事の内容を使っていないか。", "参照対象を追加すると確認できる旨の提案は許容する。"],
  },
];
