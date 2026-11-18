import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

import { cn } from "./utils";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { ComponentProps, ReactNode } from "react";

const HANDLE_ATTRIBUTE = "data-sortable-handle";
const MOUSE_DRAG_DISTANCE = 6;
const TOUCH_DRAG_DELAY_MS = 250;
const TOUCH_DRAG_TOLERANCE = 8;

const startKeyboardDrag = KeyboardSensor.activators[0]?.handler;

// 항목 전체를 마우스·터치로 잡을 수 있게 하되, 키보드는 손잡이에서만 시작함(항목 안의 삭제 버튼 등에서 Space·Enter가 드래그로 번지지 않게).
class HandleKeyboardSensor extends KeyboardSensor {
  static override activators: typeof KeyboardSensor.activators = [
    {
      eventName: "onKeyDown",
      handler: (event, options, context) => {
        const { target } = event.nativeEvent;
        const isOnHandle =
          target instanceof Element &&
          target.closest(`[${HANDLE_ATTRIBUTE}]`) !== null;
        return isOnHandle && startKeyboardDrag?.(event, options, context);
      },
    },
  ];
}

interface SortableAnnouncements {
  /** 스크린 리더에 알리는 문구. index는 1부터 시작함. */
  instructions: string;
  pickedUp: (index: number) => string;
  moved: (index: number) => string;
  dropped: (index: number) => string;
  cancelled: () => string;
}

interface SortableGridProps {
  ids: string[];
  onChangeOrder: (fromIndex: number, toIndex: number) => void;
  announcements: SortableAnnouncements;
  /** 끄는 동안 커서를 따라다니는 항목. 원래 자리는 놓일 위치를 보여 주는 빈 칸으로 바뀜. */
  renderOverlay: (id: string) => ReactNode;
  className?: string;
  children: ReactNode;
}

/** 드래그로 순서를 바꾸는 격자 목록. `<li>`인 `SortableItem`을 자식으로 받음. */
export function SortableGrid({
  ids,
  onChangeOrder,
  announcements,
  renderOverlay,
  className,
  children,
}: SortableGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: MOUSE_DRAG_DISTANCE },
    }),
    // 지연을 두어 스크롤과 구분함.
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_DRAG_DELAY_MS,
        tolerance: TOUCH_DRAG_TOLERANCE,
      },
    }),
    useSensor(HandleKeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function indexOf(id: string | number) {
    return ids.indexOf(String(id)) + 1;
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    onChangeOrder(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        screenReaderInstructions: { draggable: announcements.instructions },
        announcements: {
          onDragStart: ({ active }) =>
            announcements.pickedUp(indexOf(active.id)),
          onDragOver: ({ over }) =>
            over ? announcements.moved(indexOf(over.id)) : undefined,
          onDragEnd: ({ over, active }) =>
            announcements.dropped(indexOf((over ?? active).id)),
          onDragCancel: () => announcements.cancelled(),
        },
      }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className={className}>{children}</ul>
      </SortableContext>
      <DragOverlay>{activeId && renderOverlay(activeId)}</DragOverlay>
    </DndContext>
  );
}

interface SortableHandleProps {
  ref: (node: HTMLElement | null) => void;
  [HANDLE_ATTRIBUTE]: "";
}

interface SortableItemProps extends Omit<ComponentProps<"li">, "children"> {
  id: string;
  disabled?: boolean;
  /** `handleProps`를 키보드로 순서를 바꾸는 버튼에 펼쳐 줌. */
  children: (state: {
    handleProps: SortableHandleProps & Record<string, unknown>;
  }) => ReactNode;
}

export function SortableItem({
  id,
  disabled,
  className,
  style,
  children,
  ...props
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <li
      ref={setNodeRef}
      {...props}
      {...listeners}
      style={{
        ...style,
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        // iOS 길게 누르기 메뉴(이미지 저장 등)가 드래그를 가로채지 않게 함.
        !disabled &&
          "touch-manipulation select-none [-webkit-touch-callout:none]",
        // 놓일 자리 표시: 내용은 감추고 점선 칸만 남김(커서를 따라다니는 모습은 DragOverlay가 그림).
        isDragging && "border-dashed border-primary bg-primary/5 *:invisible",
        className,
      )}
    >
      {children({
        handleProps: {
          ...attributes,
          ref: setActivatorNodeRef,
          [HANDLE_ATTRIBUTE]: "",
        },
      })}
    </li>
  );
}
