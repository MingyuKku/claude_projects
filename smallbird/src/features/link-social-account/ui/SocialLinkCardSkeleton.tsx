import { SOCIAL_PROVIDERS } from "@/entities/account";
import { SkeletonSectionCard } from "@/shared/components/skeleton-presets";
import { Skeleton } from "@/shared/ui/skeleton";

/** SocialLinkCard 자리: 브랜드 아이콘 + 이름 | 스위치 행 */
export function SocialLinkCardSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonSectionCard titleClassName="w-28" className={className}>
      <div className="flex flex-col p-3 tablet:p-5">
        {SOCIAL_PROVIDERS.map((provider) => (
          <div key={provider} className="flex min-h-12 items-center gap-2 px-4">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-5 w-9 rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonSectionCard>
  );
}
