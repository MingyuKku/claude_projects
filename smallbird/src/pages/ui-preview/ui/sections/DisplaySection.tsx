import { CornerDownRight, Pencil, Trash } from "lucide-react";

import { AvatarEdit } from "@/shared/components/avatar-edit";
import { Avatar, AvatarFallback, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import { PreviewMatrix } from "../PreviewMatrix";
import { Section } from "../Section";

const AVATAR_SIZES = [
  "xxs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
] as const;
const AVATAR_ROWS = [
  "AvatarImage",
  "AvatarImageRounded",
  "AvatarFallback",
] as const;
const TOOLBAR_ACTIONS = [
  { label: "답장", icon: CornerDownRight },
  { label: "수정", icon: Pencil },
  { label: "삭제", icon: Trash },
];

export function DisplaySection() {
  return (
    <>
      <Section title="Tooltip (4731:9719)">
        <div className="flex gap-24 pt-12 pb-4">
          <Tooltip open>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover</Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add to library</TooltipContent>
          </Tooltip>
          <Tooltip open>
            <TooltipTrigger asChild>
              <Button variant="outline">Toolbar</Button>
            </TooltipTrigger>
            <TooltipContent side="top" variant="toolbar">
              {TOOLBAR_ACTIONS.map(({ label, icon: Icon }) => (
                <Button
                  key={label}
                  variant="ghost-foreground"
                  size="icon"
                  aria-label={label}
                >
                  <Icon />
                </Button>
              ))}
            </TooltipContent>
          </Tooltip>
        </div>
      </Section>

      <Section title="Separator (4733:7320)">
        <div className="flex w-60 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm leading-none font-medium">Radix Primitives</p>
            <p className="text-sm text-muted-foreground">
              An open-source UI component library.
            </p>
          </div>
          <Separator />
          <div className="flex h-5 items-center gap-4 text-sm">
            <span>Blog</span>
            <Separator orientation="vertical" />
            <span>Docs</span>
            <Separator orientation="vertical" />
            <span>Source</span>
          </div>
        </div>
      </Section>

      <Section title="Avatar (4732:14439)">
        <PreviewMatrix
          rows={AVATAR_ROWS}
          columns={AVATAR_SIZES}
          rowLabel={(row) => row}
          columnLabel={(size) => `:${size}`}
          renderCell={(row, size) => (
            <Avatar
              size={size}
              shape={row === "AvatarImageRounded" ? "rounded" : "circle"}
            >
              {row === "AvatarFallback" ? (
                <AvatarFallback>CN</AvatarFallback>
              ) : (
                <AvatarPlaceholder />
              )}
            </Avatar>
          )}
        />
        <AvatarEdit alt="프로필" editLabel="프로필 사진 수정" />
      </Section>
    </>
  );
}
