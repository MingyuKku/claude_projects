import { Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

import type { PreviewState } from "../PreviewMatrix";
import type { ComponentProps } from "react";

type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>;
type ButtonSize = NonNullable<ComponentProps<typeof Button>["size"]>;
type ButtonState = PreviewState | "loading";

// Figma Button(2718:8237) 표의 열 순서
const TYPES = [
  ["Primary", "default"],
  ["Secondary", "secondary"],
  ["Outline", "outline"],
  ["Ghost", "ghost"],
  ["Link", "link"],
  ["Link Secondary", "link-secondary"],
  ["Outline Muted", "outline-muted"],
  ["Ghost Muted", "ghost-muted"],
  ["Outline Foreground", "outline-foreground"],
  ["Ghost Foreground", "ghost-foreground"],
] as const satisfies readonly (readonly [string, ButtonVariant])[];
const ICON_TYPES = TYPES.filter(([name]) => name !== "Link Secondary");
const TEXT_SIZES = [
  ["md", "default"],
  ["sm", "sm"],
  ["xs", "xs"],
] as const satisfies readonly (readonly [string, ButtonSize])[];
const ICON_SIZES = [
  ["lg", "icon-lg"],
  ["md", "icon"],
  ["sm", "icon-sm"],
  ["xs", "icon-xs"],
  ["xss", "icon-xss"],
] as const satisfies readonly (readonly [string, ButtonSize])[];
const STATES = ["default", "hover", "focus", "disabled", "loading"] as const;
const ICON_STATES = ["default", "hover", "focus", "disabled"] as const;
const TONES = [false, true] as const;

const variantOf = (name: string) =>
  TYPES.find(([typeName]) => typeName === name)?.[1] ?? "default";

const stateProps = (state: ButtonState) => ({
  ...(state === "loading" ? {} : previewStateProps(state)),
  disabled: state === "disabled",
  isLoading: state === "loading",
});

function TextButtonMatrix({
  size,
  destructive,
}: {
  size: ButtonSize;
  destructive: boolean;
}) {
  return (
    <PreviewMatrix
      rows={STATES}
      columns={TYPES.map(([name]) => name)}
      renderCell={(state, name) => (
        <Button
          variant={variantOf(name)}
          destructive={destructive}
          size={size}
          {...stateProps(state)}
        >
          {state !== "loading" && <Plus />}
          Button
          {state !== "loading" && <Plus />}
        </Button>
      )}
    />
  );
}

function IconButtonMatrix({
  size,
  destructive,
}: {
  size: ButtonSize;
  destructive: boolean;
}) {
  return (
    <PreviewMatrix
      rows={ICON_STATES}
      columns={ICON_TYPES.map(([name]) => name)}
      renderCell={(state, name) => (
        <Button
          variant={variantOf(name)}
          destructive={destructive}
          size={size}
          aria-label={`${name} ${state}`}
          {...stateProps(state)}
        >
          <Plus />
        </Button>
      )}
    />
  );
}

export function ButtonSection() {
  return (
    <>
      {TEXT_SIZES.map(([sizeName, size]) => (
        <Section key={sizeName} title={`Button · ${sizeName} (2718:8237)`}>
          {TONES.map((destructive) => (
            <div key={String(destructive)} className="flex flex-col gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                {destructive ? "Destructive" : "Default"}
              </span>
              <TextButtonMatrix size={size} destructive={destructive} />
            </div>
          ))}
        </Section>
      ))}
      {ICON_SIZES.map(([sizeName, size]) => (
        <Section key={sizeName} title={`Icon Button · ${sizeName} (2718:8839)`}>
          {TONES.map((destructive) => (
            <div key={String(destructive)} className="flex flex-col gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                {destructive ? "Destructive" : "Default"}
              </span>
              <IconButtonMatrix size={size} destructive={destructive} />
            </div>
          ))}
        </Section>
      ))}
    </>
  );
}
