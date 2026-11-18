import { RadioField, RadioOption } from "@/shared/components/radio-field";
import { SwitchOption } from "@/shared/components/switch-field";
import { Checkbox } from "@/shared/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Switch } from "@/shared/ui/switch";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

import type { PreviewState } from "../PreviewMatrix";

const BASE_STATES = ["default", "focus", "disabled"] as const;
const GROUP_COLUMNS = ["default", "disabled", "destructive"] as const;
const SIDES = ["left", "right"] as const;
const SIDEBAR_ITEMS = [
  "Recents",
  "Home",
  "Applications",
  "Desktop",
  "Downloads",
  "Documents",
];
const LABEL = "Accept terms and conditions";
const DESCRIPTION = "You agree to our Terms of Service and Privacy Policy.";
const ERROR_TEXT = "Your one-time password must be 6 characters.";
// Figma: Outlined 카드는 일반 항목보다 16px 왼쪽에서 시작(폭 377+32)해 안쪽 컨트롤이 같은 세로선에 맞음.
const ITEM_WIDTH = {
  outlined: "-ml-4 w-[409px]",
  text: "w-[377px]",
  inline: undefined,
} as const;
const SWITCH_ITEM_WIDTH = {
  Default: ITEM_WIDTH.inline,
  Description: ITEM_WIDTH.text,
  Outlined: ITEM_WIDTH.outlined,
} as const;

type GroupColumn = (typeof GROUP_COLUMNS)[number];

const stateOf = (state: PreviewState) => ({
  ...previewStateProps(state),
  disabled: state === "disabled",
});

function CheckboxBaseMatrix() {
  const columns = ["Unselected", "Intermediate", "Selected"] as const;
  const checkedOf = {
    Unselected: false,
    Intermediate: "indeterminate",
    Selected: true,
  } as const;
  return (
    <PreviewMatrix
      rows={BASE_STATES}
      columns={columns}
      renderCell={(state, column) => (
        <Checkbox
          aria-label={`${column} ${state}`}
          checked={checkedOf[column]}
          {...stateOf(state)}
        />
      )}
    />
  );
}

function RadioGroupSample({ column }: { column: GroupColumn }) {
  return (
    <RadioField
      className="w-96"
      title="Sidebar"
      description="Select the items you want to display in the sidebar."
      errorText={column === "destructive" ? ERROR_TEXT : undefined}
      disabled={column === "disabled"}
    >
      <RadioGroup>
        {SIDEBAR_ITEMS.map((item) => (
          <RadioOption
            key={item}
            value={item}
            label={item}
            isInvalid={column === "destructive"}
          />
        ))}
      </RadioGroup>
    </RadioField>
  );
}

function RadioItemSample({
  type,
  side,
  column,
}: {
  type: "With text" | "Outlined" | "Group item";
  side: (typeof SIDES)[number];
  column: GroupColumn;
}) {
  return (
    <RadioGroup
      defaultValue="on"
      className={type === "Outlined" ? ITEM_WIDTH.outlined : ITEM_WIDTH.text}
    >
      <RadioOption
        value="on"
        label={LABEL}
        description={type === "Group item" ? undefined : DESCRIPTION}
        variant={type === "Outlined" ? "outlined" : "plain"}
        indicatorPosition={side}
        isInvalid={column === "destructive"}
        disabled={column === "disabled"}
      />
    </RadioGroup>
  );
}

function RadioBaseMatrix() {
  const columns = ["Unselected", "Selected"] as const;
  return (
    <PreviewMatrix
      rows={BASE_STATES}
      columns={columns}
      renderCell={(state, column) => (
        <RadioGroup defaultValue={column === "Selected" ? "on" : undefined}>
          <RadioGroupItem
            value="on"
            aria-label={`${column} ${state}`}
            {...stateOf(state)}
          />
        </RadioGroup>
      )}
    />
  );
}

function SwitchItemSample({
  type,
  side,
  column,
}: {
  type: "Default" | "Description" | "Outlined";
  side: (typeof SIDES)[number];
  column: GroupColumn;
}) {
  return (
    <SwitchOption
      className={SWITCH_ITEM_WIDTH[type]}
      defaultChecked
      label={LABEL}
      description={type === "Default" ? undefined : DESCRIPTION}
      variant={type === "Outlined" ? "outlined" : "plain"}
      indicatorPosition={side}
      isInvalid={column === "destructive"}
      disabled={column === "disabled"}
    />
  );
}

function SwitchBaseMatrix() {
  const columns = [
    "md · false",
    "md · true",
    "sm · false",
    "sm · true",
  ] as const;
  return (
    <PreviewMatrix
      rows={BASE_STATES}
      columns={columns}
      renderCell={(state, column) => (
        <Switch
          aria-label={`${column} ${state}`}
          size={column.startsWith("md") ? "default" : "sm"}
          defaultChecked={column.endsWith("true")}
          {...stateOf(state)}
        />
      )}
    />
  );
}

export function ChoiceSection() {
  return (
    <>
      <Section title="Checkbox (4732:20246)">
        <CheckboxBaseMatrix />
      </Section>

      <Section title="Radio Group (6922:37586)">
        <PreviewMatrix
          rows={["Default"] as const}
          columns={GROUP_COLUMNS}
          rowLabel={(row) => row}
          columnLabel={(column) => `:${column}`}
          renderCell={(_, column) => <RadioGroupSample column={column} />}
        />
        {SIDES.map((side) => (
          <PreviewMatrix
            key={side}
            rows={["With text", "Outlined", "Group item"] as const}
            columns={GROUP_COLUMNS}
            rowLabel={(row) => `${side === "left" ? "Left" : "Right"} · ${row}`}
            columnLabel={(column) => `:${column}`}
            renderCell={(row, column) => (
              <RadioItemSample type={row} side={side} column={column} />
            )}
          />
        ))}
        <RadioBaseMatrix />
      </Section>

      <Section title="Switch (6918:62617)">
        {SIDES.map((side) => (
          <PreviewMatrix
            key={side}
            rows={["Default", "Description", "Outlined"] as const}
            columns={GROUP_COLUMNS}
            rowLabel={(row) => `${side === "left" ? "Left" : "Right"} · ${row}`}
            columnLabel={(column) => `:${column}`}
            renderCell={(row, column) => (
              <SwitchItemSample type={row} side={side} column={column} />
            )}
          />
        ))}
        <SwitchBaseMatrix />
      </Section>
    </>
  );
}
