import { useSubSelfAccount } from "@/entities/account";
import {
  AccountInfoCardSkeleton,
  AccountProfileCard,
} from "@/features/edit-account-profile";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";

import { LoadFailedState } from "./LoadFailedState";

export function SubSelfTab() {
  const { account, isLoading, isError, mutate } = useSubSelfAccount();

  if (isLoading) {
    return (
      <SkeletonGroup>
        <AccountInfoCardSkeleton />
      </SkeletonGroup>
    );
  }

  if (isError || !account) {
    return <LoadFailedState onRetry={() => void mutate()} />;
  }

  return (
    <AccountProfileCard
      accountType="sub"
      profile={account.profile}
      profileImageUrl={account.profileImageUrl}
      onSaved={() => void mutate()}
    />
  );
}
