import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readDocument, searchDocuments } from "../lib/documents";

test("検索は本文を含めず、記事のIDと概要を返す", () => {
  const results = searchDocuments("送料");
  assert.equal(results[0]?.id, "shipping");
  assert.equal("body" in results[0], false);
});
test("空入力と存在しない情報は検索結果が空になる", () => {
  assert.deepEqual(searchDocuments("  "), []);
  assert.deepEqual(searchDocuments("海外配送"), []);
});
test("参照先の記事から申請手順を取得できる", () => {
  const returns = readDocument("returns");
  assert.equal(returns.found, true);
  if (returns.found) assert.match(returns.body, /support/);
  const support = readDocument("support");
  assert.equal(support.found, true);
  if (support.found) assert.match(support.body, /注文履歴/);
});
test("パスを指定しても外部ファイルを読まない", () => {
  assert.equal(readDocument("../.env.local").found, false);
});
