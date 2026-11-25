import { Trans, useTranslation } from "@/shared/i18n";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Checkbox } from "@/shared/ui/checkbox";
import { Table, TableBody, TableCell, TableRow } from "@/shared/ui/table";

import { useMatchingPlatforms } from "../api/use-matching";
import { CreatorChannelButton } from "./CreatorChannelButton";
import { CreatorScrollArea } from "./CreatorScrollArea";

import type { CreatorViewModel } from "../model/types";

interface SelectedCreatorSectionProps {
  targets: CreatorViewModel[];
  checkedKeys: ReadonlySet<string>;
  onChangeChecked: (key: string, isChecked: boolean) => void;
}

// 저장·제안할 크리에이터 표. 체크를 끈 행은 남겨 두고 보낼 대상에서만 뺌.
export function SelectedCreatorSection({
  targets,
  checkedKeys,
  onChangeChecked,
}: SelectedCreatorSectionProps) {
  const { t } = useTranslation("entities/creator");
  const { platforms } = useMatchingPlatforms();

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <h3 className="ds-text-sm-none-semibold text-foreground">
        {t("selected.title")}
      </h3>
      <CreatorScrollArea className="flex-1 overflow-hidden rounded-lg border">
        <Table
          size="xs"
          aria-label={t("selected.title")}
          containerClassName="overflow-visible rounded-none border-0"
        >
          <TableBody>
            {targets.map((item) => {
              const platform = platforms.find(
                (option) => option.platformIdx === item.platformIdx,
              );
              return (
                <TableRow key={item.key}>
                  <TableCell className="w-12">
                    <Checkbox
                      className="block"
                      aria-label={t("selected.row", { name: item.nickname })}
                      checked={checkedKeys.has(item.key)}
                      onCheckedChange={(state) =>
                        onChangeChecked(item.key, state === true)
                      }
                    />
                  </TableCell>
                  <TableCell className="max-w-0">
                    <div className="flex items-center ds-gap-3">
                      <Avatar size="sm">
                        <AvatarImage
                          src={item.profileImageUrl ?? undefined}
                          alt=""
                        />
                        <AvatarPlaceholder />
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="-mb-1 truncate pb-1 ds-text-sm-none-medium text-foreground">
                          {item.nickname}
                        </p>
                        <p className="truncate ds-text-xs-4-normal text-muted-foreground">
                          @{item.platformId}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-0">
                    {platform && (
                      <CreatorChannelButton
                        platform={platform}
                        url={item.platformUrl}
                        size="xs"
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CreatorScrollArea>
      <p className="flex items-center gap-1 ds-text-sm-none-medium text-foreground">
        <Trans
          t={t}
          i18nKey="selected.count"
          count={checkedKeys.size}
          components={{
            em: <span className="ds-text-sm-none-semibold text-primary" />,
          }}
        />
      </p>
    </section>
  );
}
