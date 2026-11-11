"use client";

import { EmojiPicker } from "frimousse";
import type {
  EmojiPickerListCategoryHeaderProps,
  EmojiPickerListEmojiProps,
  EmojiPickerListRowProps,
} from "frimousse";
import type { Locale } from "@/config/site";
import type { Messages } from "@/lib/i18n";

export type EmojiLibraryLabels = Pick<
  Messages["emojiWallpaper"],
  "emojiPlaceholder" | "emojiLoading" | "emojiEmpty"
>;

/** Emojibase ships lowercase locale folders, so the app locale needs folding. */
const emojiDataLocales: Record<Locale, string> = {
  en: "en",
  "zh-Hant": "zh-hant",
};

function CategoryHeader({ category, ...props }: EmojiPickerListCategoryHeaderProps) {
  return (
    <div
      {...props}
      className="bg-background px-3 py-2 text-xs font-medium text-muted-foreground"
    >
      {category.label}
    </div>
  );
}

function Row({ children, ...props }: EmojiPickerListRowProps) {
  return (
    <div {...props} className="flex w-full gap-0.5 px-1.5">
      {children}
    </div>
  );
}

function Emoji({ emoji, ...props }: EmojiPickerListEmojiProps) {
  return (
    <button
      {...props}
      type="button"
      className="flex aspect-square flex-1 cursor-pointer items-center justify-center rounded-md text-xl transition-colors hover:bg-muted data-active:bg-muted"
    >
      {emoji.emoji}
    </button>
  );
}

/** Kept at module scope so the virtualised list never sees new component identities. */
const listComponents = { CategoryHeader, Row, Emoji };

export function EmojiLibrary({
  locale,
  labels,
  onSelect,
}: {
  locale: Locale;
  labels: EmojiLibraryLabels;
  onSelect: (emoji: string) => void;
}) {
  return (
    <EmojiPicker.Root
      locale={emojiDataLocales[locale]}
      emojibaseUrl="/emoji-data"
      columns={9}
      data-testid="emoji-library"
      onEmojiSelect={({ emoji }) => onSelect(emoji)}
      className="flex h-80 w-full max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-background"
    >
      <EmojiPicker.Search
        placeholder={labels.emojiPlaceholder}
        className="w-full shrink-0 border-b border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
      />
      <EmojiPicker.Viewport className="relative flex-1 overflow-y-auto">
        <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          {labels.emojiLoading}
        </EmojiPicker.Loading>
        <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          {labels.emojiEmpty}
        </EmojiPicker.Empty>
        <EmojiPicker.List className="pb-1 select-none" components={listComponents} />
      </EmojiPicker.Viewport>
    </EmojiPicker.Root>
  );
}
