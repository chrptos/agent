// Public, fictional fixtures only. No external files are read.
export const documents = [
  { id: "shipping", title: "配送ガイド", summary: "配送日数と送料について", body: "通常配送は注文確定から3営業日以内に発送します。送料は500円です。合計5,000円以上の注文は送料無料です。返品については返品ガイド（returns）を参照してください。" },
  { id: "returns", title: "返品ガイド", summary: "返品の条件と申請手順について", body: "未使用の商品は到着から14日以内に返品を申請できます。お客様都合の返送料はお客様負担です。不良品の返送料は店舗負担です。申請には注文番号が必要です。申請方法はサポート窓口（support）を参照してください。" },
  { id: "support", title: "サポート窓口", summary: "問い合わせと返品の申請方法について", body: "サポートは平日10時から17時まで対応します。返品はアプリの注文履歴から対象注文を開き、「サポートに相談」を選択して申請してください。" },
];

export function searchDocuments(query: string) {
  const terms = query.normalize("NFKC").toLowerCase().split(/[\s、,。]+/u).filter(Boolean);
  return documents.map(({ id, title, summary, body }) => ({
    id, title, summary,
    score: terms.filter(term => `${title} ${summary} ${body}`.toLowerCase().includes(term)).length,
  })).filter(document => document.score > 0).sort((a, b) => b.score - a.score)
    .map(({ id, title, summary }) => ({ id, title, summary }));
}

export function readDocument(id: string) {
  const document = documents.find(document => document.id === id);
  return document ? { found: true as const, ...document } : { found: false as const, id, message: "該当する記事はありません。検索で記事IDを確認してください。" };
}
