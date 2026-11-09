import { useId } from "react";

import { cn } from "@/shared/lib/utils";
import { Label } from "@/shared/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type { ReactNode } from "react";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** 라벨 앞에 놓는 아이콘(플랫폼 로고). */
  icon?: ReactNode;
  isDisabled?: boolean;
}

interface ChoiceGroupBaseProps<T extends string> {
  label: string;
  isRequired?: boolean;
  options: readonly ChoiceOption<T>[];
  className?: string;
}

interface ChoiceToggleGroupProps<
  T extends string,
> extends ChoiceGroupBaseProps<T> {
  value: T | null;
  onChangeValue: (value: T) => void;
}

interface MultiChoiceToggleGroupProps<
  T extends string,
> extends ChoiceGroupBaseProps<T> {
  value: readonly T[];
  onChangeValue: (value: T[]) => void;
}

function ChoiceGroupShell({
  label,
  isRequired,
  className,
  children,
}: {
  label: string;
  isRequired: boolean;
  className?: string;
  children: (labelId: string) => ReactNode;
}) {
  const labelId = useId();

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cn("flex flex-col gap-2", className)}
    >
      <Label id={labelId} className="gap-0.5">
        {label}
        {isRequired && (
          <span aria-hidden="true" className="font-semibold text-primary">
            *
          </span>
        )}
      </Label>
      {children(labelId)}
    </div>
  );
}

function ChoiceItems<T extends string>({
  options,
}: {
  options: readonly ChoiceOption<T>[];
}) {
  return options.map((option) => (
    <ToggleGroupItem
      key={option.value}
      value={option.value}
      disabled={option.isDisabled}
    >
      {option.icon}
      {option.label}
    </ToggleGroupItem>
  ));
}

// 단일 선택 테두리 토글(Figma Toggle {Outlined=True}). 선택은 포커스 링과 구분되는 눌린(Pressed) 모양이고(스펙 D-2),
// 선택한 값을 다시 눌러도 해제하지 않음. 줄이 모자라면 아래 줄로 넘어감(모바일 시안).
export function ChoiceToggleGroup<T extends string>({
  label,
  isRequired = false,
  options,
  value,
  onChangeValue,
  className,
}: ChoiceToggleGroupProps<T>) {
  return (
    <ChoiceGroupShell
      label={label}
      isRequired={isRequired}
      className={className}
    >
      {() => (
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={value ?? ""}
          onValueChange={(next) => {
            // 같은 값을 다시 누르면 빈 값이 오므로 무시함(단일 선택은 해제하지 않음).
            const picked = options.find((option) => option.value === next);
            if (picked) onChangeValue(picked.value);
          }}
          className="flex-wrap"
        >
          <ChoiceItems options={options} />
        </ToggleGroup>
      )}
    </ChoiceGroupShell>
  );
}

/** 복수 선택 테두리 토글. 눌러서 켜고 끄며 선택 순서와 상관없이 `options` 순서로 돌려줌. */
export function MultiChoiceToggleGroup<T extends string>({
  label,
  isRequired = false,
  options,
  value,
  onChangeValue,
  className,
}: MultiChoiceToggleGroupProps<T>) {
  return (
    <ChoiceGroupShell
      label={label}
      isRequired={isRequired}
      className={className}
    >
      {() => (
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={2}
          value={[...value]}
          onValueChange={(next) =>
            onChangeValue(
              options
                .map((option) => option.value)
                .filter((optionValue) => next.includes(optionValue)),
            )
          }
          className="flex-wrap"
        >
          <ChoiceItems options={options} />
        </ToggleGroup>
      )}
    </ChoiceGroupShell>
  );
}
