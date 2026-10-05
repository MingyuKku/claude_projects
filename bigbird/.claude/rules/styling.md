---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# UI 시스템 (shadcn/ui & Tailwind CSS & CVA)

## 1. 컴포넌트 라이브러리 배치 (`src/shared/ui/`)

- 모든 `shadcn/ui` (Radix UI 기반) 컴포넌트는 FSD 규칙에 따라 **`src/shared/ui/`**에 위치합니다.
- 예: `src/shared/ui/button.tsx`, `src/shared/ui/dialog.tsx`, `src/shared/ui/input.tsx`, `src/shared/ui/card.tsx`.

## 2. 유틸리티 헬퍼 (`src/shared/lib/utils.ts`)

shadcn 표준 `cn` 헬퍼 함수를 사용하여 클래스를 안전하게 병합합니다:

```typescript
// src/shared/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 3. CVA (Class Variance Authority) 컴포넌트 변형 패턴

모든 UI 컴포넌트의 변형(variant, size, color)은 `cva`를 통해 타입 안전하게 관리합니다:

```tsx
// src/shared/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        glass: 'bg-white/10 dark:bg-zinc-900/60 backdrop-blur-md border border-white/20 hover:bg-white/20 shadow-lg',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-2xl px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';
```
