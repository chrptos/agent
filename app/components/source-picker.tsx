import { PlusIcon, ChevronDownIcon } from "lucide-react";
import { InputGroupButton } from "@/components/ui/input-group";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { documents } from "../../lib/documents";

type SourcePickerProps = {
  documentIds: string[];
  sourcesOpen: boolean;
  selectionLocked: boolean;
  onToggle: () => void;
  onSelect: (id: string, selected: boolean) => void;
};

export function SourcePicker({
  documentIds,
  sourcesOpen,
  selectionLocked,
  onToggle,
  onSelect,
}: SourcePickerProps) {
  return (
    <Popover open={sourcesOpen} onOpenChange={onToggle}>
      <PopoverTrigger
        render={
          <InputGroupButton
            size="icon-sm"
            className="rounded-full"
            aria-label={`参照記事を選択（${documentIds.length}件選択中）`}
            title="参照記事を選択"
          />
        }
      >
        <PlusIcon />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="max-h-[min(24rem,60dvh)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto p-4"
      >
        <div className="mb-2 flex flex-wrap justify-between gap-1 text-xs font-medium">
          <PopoverTitle>参照する記事</PopoverTitle>
          <span>架空のサンプルデータ</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {selectionLocked
            ? "参照先を変更するには「新しい会話」を始めてください。"
            : "選んだ記事だけを使って回答します。"}
        </p>
        <fieldset disabled={selectionLocked} className="space-y-4">
          <legend className="sr-only">参照する記事を選択</legend>
          {documents.map((document) => (
            <div className="text-sm" key={document.id}>
              <label className="flex items-start gap-3">
                <Checkbox
                  className="mt-0.5"
                  disabled={selectionLocked}
                  checked={documentIds.includes(document.id)}
                  onCheckedChange={(checked) =>
                    onSelect(document.id, checked === true)
                  }
                />
                <span>
                  {document.title}
                  <small className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {document.summary}
                  </small>
                </span>
              </label>
              <Collapsible id={`doc-${document.id}`} className="ml-7 mt-1">
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  本文を見る
                  <ChevronDownIcon className="size-3" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 text-xs leading-6 whitespace-pre-wrap">
                  {document.body}
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
