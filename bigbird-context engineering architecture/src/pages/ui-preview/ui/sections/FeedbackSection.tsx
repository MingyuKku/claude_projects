import { XIcon } from "lucide-react";

import { FormField } from "@/shared/components/form-field";
import {
  SkeletonCard,
  SkeletonLine,
} from "@/shared/components/skeleton-presets";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Progress } from "@/shared/ui/progress";
import {
  Sheet,
  SheetBody,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Slider } from "@/shared/ui/slider";

import { PreviewMatrix } from "../PreviewMatrix";
import { Section } from "../Section";

const PROGRESS_VALUES = [
  "0",
  "10",
  "20",
  "30",
  "40",
  "50",
  "60",
  "70",
  "80",
  "90",
  "100",
] as const;
const PROGRESS_SIZES = ["lg", "md", "sm", "xs"] as const;
const SIDES = ["right", "left", "bottom", "top"] as const;
const SKELETON_STATES = ["01", "02"] as const;
const SKELETON_KINDS = ["Line", "Card"] as const;
const EDIT_FIELDS = ["Name", "Username"] as const;

type Side = (typeof SIDES)[number];

// 열린 Sheet를 보여 주기 위한 정적 렌더. SheetContent는 Portal·고정 위치라 같은 마크업을 인라인으로 그림.
const SIDE_CLASS: Record<Side, string> = {
  right: "h-[600px] w-96 border-l",
  left: "h-[600px] w-96 border-r",
  bottom: "w-full max-w-[831px] border-t",
  top: "w-full max-w-[831px] border-b",
};

function SheetStatic({ side, isEdit }: { side: Side; isEdit: boolean }) {
  // SheetTitle·SheetDescription은 Dialog 컨텍스트가 필요해 닫힌 Sheet 루트로 감쌈(내용은 인라인으로 그림).
  return (
    <Sheet>
      <div
        className={cn(
          "relative flex flex-col overflow-clip bg-background shadow-lg",
          SIDE_CLASS[side],
        )}
      >
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit profile" : "Title"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Make changes to your profile here. Click save when you're done."
              : "Description"}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {isEdit ? (
            <>
              {EDIT_FIELDS.map((label) => (
                <FormField
                  key={label}
                  label={label}
                  orientation="horizontal"
                  className="grid-cols-[1fr_3fr]"
                >
                  {(control) => <Input placeholder="Email" {...control} />}
                </FormField>
              ))}
            </>
          ) : (
            <div className="flex h-[100px] items-center justify-center rounded-lg border border-dashed border-ring bg-accent p-6 text-center text-sm italic">
              <p className="opacity-60">
                <span className="block text-foreground">
                  Place your content here
                </span>
                <span className="block text-muted-foreground">
                  with Opt + Cmnd
                </span>
              </p>
            </div>
          )}
        </SheetBody>
        <SheetFooter>
          <Button>Save changes</Button>
        </SheetFooter>
        <span className="absolute top-2.5 right-2.5 rounded-sm p-1.5">
          <XIcon className="size-4" />
        </span>
      </div>
    </Sheet>
  );
}

export function FeedbackSection() {
  return (
    <>
      <Section title="Slider (6984:77872)">
        <PreviewMatrix
          rows={PROGRESS_VALUES}
          columns={["Default", "Double Side"] as const}
          rowLabel={(value) => `Progress: ${value}%`}
          renderCell={(value, type) => (
            <Slider
              className="w-100"
              aria-label={`${type} ${value}%`}
              defaultValue={
                type === "Default" ? [Number(value)] : [0, Number(value)]
              }
            />
          )}
        />
      </Section>
      <Section title="Progress (7085:123675)">
        <PreviewMatrix
          rows={PROGRESS_VALUES}
          columns={PROGRESS_SIZES}
          rowLabel={(value) => `Progress: ${value}%`}
          columnLabel={(size) => `Size: ${size}`}
          renderCell={(value, size) => (
            <Progress className="w-100" size={size} value={Number(value)} />
          )}
        />
      </Section>
      <Section title="Sheet (4733:6971)">
        <PreviewMatrix
          rows={SIDES}
          columns={["Edit profile", "Blanket"] as const}
          rowLabel={(side) => side}
          renderCell={(side, column) => (
            <SheetStatic side={side} isEdit={column === "Edit profile"} />
          )}
        />
      </Section>
      <Section title="Skeleton (4733:6553)">
        <PreviewMatrix
          rows={SKELETON_STATES}
          columns={SKELETON_KINDS}
          rowLabel={(state) => `State: ${state}`}
          renderCell={(state, kind) => {
            const className = cn("w-[250px]", state === "02" && "opacity-50");
            return kind === "Line" ? (
              <SkeletonLine className={className} />
            ) : (
              <SkeletonCard className={className} />
            );
          }}
        />
      </Section>
    </>
  );
}
