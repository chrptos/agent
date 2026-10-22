import { documents } from "../../lib/documents";

type SourcePickerProps = {
  documentIds: string[];
  sourcesOpen: boolean;
  selectionLocked: boolean;
  onToggle: () => void;
  onSelect: (id: string, selected: boolean) => void;
};

export function SourcePicker({ documentIds, sourcesOpen, selectionLocked, onToggle, onSelect }: SourcePickerProps) {
  const caption = documentIds.length === documents.length
    ? "すべての記事"
    : documents.filter(document => documentIds.includes(document.id))
      .map(document => document.title).join("・") || "未選択";

  return (
    <>
      <div className="source-controls">
        <button type="button" className="source-trigger" aria-expanded={sourcesOpen} aria-controls="source-picker" onClick={onToggle}>
          ＋ 参照する記事 <span>{documentIds.length}件</span>
        </button>
        <span className="source-caption">{caption}</span>
      </div>
      {sourcesOpen && (
        <div id="source-picker" className="source-picker">
          <div className="source-heading">
            <h3>参照する記事</h3><span>架空のサンプルデータ</span>
          </div>
          <p className="muted">
            {selectionLocked ? "参照先を変更するには「新しい会話」を始めてください。" : "選んだ記事だけを使って回答します。"}
          </p>
          <fieldset disabled={selectionLocked}>
            <legend className="sr-only">参照する記事を選択</legend>
            {documents.map(document => (
              <div className="source-item" key={document.id}>
                <label>
                  <input type="checkbox" checked={documentIds.includes(document.id)} onChange={event => onSelect(document.id, event.target.checked)} />
                  <span>{document.title}<small>{document.summary}</small></span>
                </label>
                <details id={`doc-${document.id}`}>
                  <summary>本文を見る</summary><p>{document.body}</p>
                </details>
              </div>
            ))}
          </fieldset>
        </div>
      )}
    </>
  );
}
