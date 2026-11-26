---
paths:
  - "src/**/ui/**/*.tsx"
  - "src/pages/**/*.tsx"
---

# 로딩 상태

처음 불러오는 자리는 `shared/components/skeleton-presets`로 실제 화면과 같은 구조의 스켈레톤을 그립니다. 기존 `*ListSkeleton.tsx`가 예시입니다. 아래는 코드만 보고 고르기 쉬운 잘못된 길을 막는 결정입니다.

- 막대 묶음은 `SkeletonGroup`으로 감쌉니다. `Skeleton`은 `aria-hidden`이라 감싸지 않으면 화면 낭독기에 로딩이 알려지지 않습니다. `role="status"`·`aria-label`을 직접 달지 않습니다.
- `TableSkeleton`의 `size`는 실제 `Table`의 `size`와 같게 넘깁니다. 다르면 로딩이 끝날 때 표 높이가 바뀝니다.
- 무한 스크롤로 다음 묶음을 읽는 중에는 `LoadMoreSpinner`(`shared/components/infinite-list`)를 씁니다. 이미 목록이 보이므로 스켈레톤 막대를 쓰지 않습니다.
- 선택지를 불러오는 Select는 라벨은 두고 선택 칸 자리에 같은 높이의 `Skeleton`을 그립니다. 빈 선택지를 열리게 두지 않습니다.
- 시안의 "—"처럼 값이 없을 때 보이는 표시는 로딩 표시가 아니므로 스켈레톤으로 바꾸지 않습니다.
- 고객센터(`customer-center-*` 화면과 문의 위젯)는 디자인 확인 전까지 스피너를 유지합니다.
