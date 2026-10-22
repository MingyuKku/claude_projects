import { formatPhoneNumber } from "@/entities/account";
import { SectionCard } from "@/shared/components/section-card";
import { formatDate, useTranslation } from "@/shared/i18n";

import type { AccountProfileViewModel } from "@/entities/account";

interface AccountInfoCardProps {
  profile: AccountProfileViewModel;
  className?: string;
}

// Figma 기본 정보(6925:50145): 읽기 전용이라 값은 50% 흐린 톤.
export function AccountInfoCard({ profile, className }: AccountInfoCardProps) {
  const { t } = useTranslation("features/edit-account-profile");

  const rows = [
    { key: "id", value: profile.identifier },
    { key: "name", value: profile.name },
    { key: "phone", value: formatPhoneNumber(profile.phone) },
    { key: "email", value: profile.email },
    {
      key: "joinedAt",
      value: profile.joinedAt
        ? formatDate(profile.joinedAt, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "",
    },
  ] as const;

  return (
    <SectionCard title={t("info.title")} className={className}>
      <dl className="flex flex-col p-3 tablet:p-5">
        {rows.map(({ key, value }) => (
          <div key={key} className="flex min-h-12 items-center gap-2 px-4">
            <dt className="shrink-0 text-sm leading-5 font-semibold text-foreground tablet:min-w-0 tablet:flex-1">
              {t(`info.${key}`)}
            </dt>
            <dd className="min-w-0 flex-1 truncate text-right text-sm leading-5 text-foreground opacity-50">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}
