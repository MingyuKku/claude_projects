import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shared/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

import { Section } from "./Section";
import { AppShellSection } from "./sections/AppShellSection";
import { ButtonSection } from "./sections/ButtonSection";
import { CardSection } from "./sections/CardSection";
import { ChartSection } from "./sections/ChartSection";
import { ChatSection } from "./sections/ChatSection";
import { ChoiceSection } from "./sections/ChoiceSection";
import { ComboboxSection } from "./sections/ComboboxSection";
import { DataSection } from "./sections/DataSection";
import { DisplaySection } from "./sections/DisplaySection";
import { FeedbackSection } from "./sections/FeedbackSection";
import { FormExtraSection } from "./sections/FormExtraSection";
import { InputSection } from "./sections/InputSection";
import { NavigationSection } from "./sections/NavigationSection";
import { SelectSection } from "./sections/SelectSection";
import { ToggleTabsSection } from "./sections/ToggleTabsSection";

// 임시 페이지: 도입한 shadcn 컴포넌트와 토큰을 Figma와 나란히 비교하기 위한 용도.
// 개발 서버에서만 라우트가 등록됨. 비교가 끝나면 슬라이스째 지움.

const BUTTON_TONES = [false, true] as const;
const TYPO_CLASSES = [
  "typo-h1",
  "typo-h2",
  "typo-h3",
  "typo-h4",
  "typo-lead",
  "typo-large",
  "typo-p",
  "typo-body",
  "typo-body-medium",
] as const;
const COLOR_TOKENS = [
  "bg-background",
  "bg-foreground",
  "bg-primary",
  "bg-primary-hover",
  "bg-secondary",
  "bg-secondary-hover",
  "bg-muted",
  "bg-muted/40",
  "bg-muted/50",
  "bg-muted-foreground",
  "bg-accent",
  "bg-accent/50",
  "bg-destructive",
  "bg-destructive-hover",
  "bg-destructive-subtle",
  "bg-destructive/10",
  "bg-destructive/20",
  "bg-success",
  "bg-success-hover",
  "bg-border",
  "bg-input",
  "bg-ring",
  "bg-sidebar-foreground",
] as const;
const RADIUS_CLASSES = [
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
] as const;

// 투명도 수식어(bg-muted/40)는 oklab 같은 형식으로 읽혀서, 캔버스에 칠한 픽셀로 sRGB 값을 얻음.
function toHex(color: string) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return color;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, alpha = 255] = ctx.getImageData(0, 0, 1, 1).data;
  const hex = [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  return alpha < 255 ? `#${hex} / ${(alpha / 255).toFixed(2)}` : `#${hex}`;
}

// 코드에 적용된 실제 값을 화면에서 읽어 Figma 값과 비교하기 위한 훅. 브레이크포인트가 바뀌면 다시 읽음.
function useComputedStyleText(read: (style: CSSStyleDeclaration) => string) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!node) return;
    const measure = () => setText(read(getComputedStyle(node)));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [node, read]);

  return { ref: setNode, text };
}

const readBackground = (style: CSSStyleDeclaration) =>
  toHex(style.backgroundColor);
const readRadius = (style: CSSStyleDeclaration) => style.borderTopLeftRadius;
const readTypography = (style: CSSStyleDeclaration) =>
  `${style.fontSize} / ${style.lineHeight} · ${style.fontWeight} · ${style.letterSpacing}`;

function ColorSwatch({ token }: { token: (typeof COLOR_TOKENS)[number] }) {
  const { ref, text } = useComputedStyleText(readBackground);
  return (
    <div className="flex w-32 flex-col gap-1">
      <div ref={ref} className={`h-12 rounded-md border ${token}`} />
      <span className="text-xs font-medium">{token.replace("bg-", "")}</span>
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}

function RadiusSample({ radius }: { radius: (typeof RADIUS_CLASSES)[number] }) {
  const { ref, text } = useComputedStyleText(readRadius);
  return (
    <div
      ref={ref}
      className={`flex size-24 flex-col items-center justify-center border bg-muted text-xs ${radius}`}
    >
      <span>{radius}</span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

function TypographySample({ typo }: { typo: (typeof TYPO_CLASSES)[number] }) {
  const { ref, text } = useComputedStyleText(readTypography);
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">
        {typo} — {text}
      </span>
      <p ref={ref} className={typo}>
        다람쥐 헌 쳇바퀴에 타고파
      </p>
    </div>
  );
}

export function UiPreviewPage() {
  return (
    <main className="mx-auto max-w-[1600px] px-4 py-8">
      <h1 className="typo-h2">UI 미리보기 (임시)</h1>
      <p className="typo-body text-muted-foreground">
        Figma 디자인 시스템과 비교용. 개발 서버에서만 열립니다.
      </p>

      <Section title="Color tokens">
        {COLOR_TOKENS.map((token) => (
          <ColorSwatch key={token} token={token} />
        ))}
      </Section>

      <Section title="Radius">
        {RADIUS_CLASSES.map((radius) => (
          <RadiusSample key={radius} radius={radius} />
        ))}
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-3">
          {TYPO_CLASSES.map((typo) => (
            <TypographySample key={typo} typo={typo} />
          ))}
        </div>
      </Section>

      <ButtonSection />

      <InputSection />

      <SelectSection />

      <ComboboxSection />

      <ChoiceSection />

      <ToggleTabsSection />

      <FeedbackSection />

      <DisplaySection />

      <CardSection />

      <DataSection />

      <NavigationSection />

      <ChartSection />

      <AppShellSection />

      <ChatSection />

      <FormExtraSection />

      <Section title="Overlay: Dialog · Alert Dialog · Sheet · Drawer · Dropdown · Context Menu · Toast">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>필터</DialogTitle>
              <DialogDescription>필터 다이얼로그 예시</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        {BUTTON_TONES.map((destructive) => (
          <AlertDialog key={String(destructive)}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" destructive={destructive}>
                Alert Dialog{destructive ? " (삭제)" : ""}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>타이틀</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 데이터가 영구적으로 삭제되며,
                  데이터를 다시 복구할 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  variant={destructive ? "outline-foreground" : "outline"}
                >
                  취소
                </AlertDialogCancel>
                <AlertDialogAction destructive={destructive}>
                  {destructive ? "삭제" : "확인"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>상세 패널</SheetTitle>
              <SheetDescription>오른쪽 사이드 패널 예시</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>모바일 필터</DrawerTitle>
              <DrawerDescription>하단 드로어 예시</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Dropdown</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>내 계정</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>마이페이지</DropdownMenuItem>
            <DropdownMenuItem>로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ContextMenu>
          <ContextMenuTrigger className="flex h-10 w-48 items-center justify-center rounded-md border border-dashed text-sm">
            우클릭
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>답장</ContextMenuItem>
            <ContextMenuItem>수정</ContextMenuItem>
            <ContextMenuItem variant="destructive">삭제</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <Button
          variant="outline"
          onClick={() => toast.success("저장되었습니다.")}
        >
          Toast
        </Button>
      </Section>
    </main>
  );
}
