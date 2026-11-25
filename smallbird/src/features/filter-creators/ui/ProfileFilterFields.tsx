import {
  LoadError,
  useCreatorFilterOptions,
  useCreatorTerms,
} from "@/entities/creator";
import { FormField } from "@/shared/components/form-field";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { useTranslation } from "@/shared/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type {
  IdxOption,
  ProfileFilterKey,
  ProfileFilters,
} from "@/entities/creator";

const SKELETON_COUNT = 5;

interface ProfileFilterFieldsProps {
  value: ProfileFilters;
  onChangeValue: (value: ProfileFilters) => void;
}

interface OptionSelectProps {
  id?: string;
  label: string;
  placeholder: string;
  options: IdxOption[];
  value: number | undefined;
  isDisabled?: boolean;
  onChangeValue: (idx: number) => void;
}

function toValue(idx: number | undefined) {
  return idx === undefined ? "" : String(idx);
}

function OptionSelect({
  id,
  label,
  placeholder,
  options,
  value,
  isDisabled,
  onChangeValue,
}: OptionSelectProps) {
  return (
    <Select
      value={toValue(value)}
      disabled={isDisabled}
      onValueChange={(next) => onChangeValue(Number(next))}
    >
      <SelectTrigger id={id} aria-label={id ? undefined : label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.idx} value={String(option.idx)}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// 선택지 이름은 서버 값을 그대로 보임. 활동 지역은 시/도를 고르면 그 아래 지역을 고를 수 있고, 더 좁힌 쪽 idx를 보냄.
export function ProfileFilterFields({
  value,
  onChangeValue,
}: ProfileFilterFieldsProps) {
  const { t } = useTranslation("features/filter-creators");
  const { term } = useCreatorTerms();
  const { options, isLoading, isError, reload } = useCreatorFilterOptions();

  const areas = options?.areas ?? [];
  const selectedArea = areas.find((area) => area.areaIdx === value.areaIdx);
  const parentAreaIdx = selectedArea?.parentAreaIdx ?? selectedArea?.areaIdx;
  const subAreaIdx =
    selectedArea?.parentAreaIdx == null ? undefined : selectedArea.areaIdx;
  const parentAreas = areas
    .filter((area) => area.parentAreaIdx === null)
    .map((area) => ({ idx: area.areaIdx, name: area.name }));
  const subAreas = areas
    .filter(
      (area) =>
        parentAreaIdx !== undefined && area.parentAreaIdx === parentAreaIdx,
    )
    .map((area) => ({ idx: area.areaIdx, name: area.name }));

  function changeKey(key: ProfileFilterKey, idx: number | undefined) {
    const next = { ...value };
    if (idx === undefined) delete next[key];
    else next[key] = idx;
    onChangeValue(next);
  }

  function renderToggles(
    key: ProfileFilterKey,
    label: string,
    toggleOptions: IdxOption[],
  ) {
    return (
      <FormField label={label}>
        {({ id }) => (
          <ToggleGroup
            id={id}
            type="single"
            variant="outline"
            size="sm"
            spacing={2}
            className="flex-wrap"
            aria-label={label}
            value={toValue(value[key])}
            onValueChange={(next) =>
              changeKey(key, next ? Number(next) : undefined)
            }
          >
            {toggleOptions.map((option) => (
              <ToggleGroupItem
                key={option.idx}
                value={String(option.idx)}
                className="px-2.25"
              >
                {option.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </FormField>
    );
  }

  if (isError) return <LoadError onClickRetry={() => void reload()} />;
  if (isLoading) {
    return (
      <SkeletonGroup className="flex flex-col ds-gap-6">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </SkeletonGroup>
    );
  }

  return (
    <>
      {renderToggles(
        "influencerServiceIdx",
        t("profile.serviceType"),
        options?.influencerServiceTypes ?? [],
      )}
      {renderToggles("genderIdx", t("profile.gender"), options?.genders ?? [])}
      <div className="grid grid-cols-2 items-end gap-2 *:min-w-0">
        <FormField label={t("profile.age")}>
          {({ id }) => (
            <OptionSelect
              id={id}
              label={t("profile.age")}
              placeholder={t("profile.agePlaceholder")}
              options={options?.ages ?? []}
              value={value.ageIdx}
              onChangeValue={(idx) => changeKey("ageIdx", idx)}
            />
          )}
        </FormField>
        <OptionSelect
          label={t("profile.ageGroupPlaceholder")}
          placeholder={t("profile.ageGroupPlaceholder")}
          options={options?.ageGroups ?? []}
          value={value.ageGroupIdx}
          onChangeValue={(idx) => changeKey("ageGroupIdx", idx)}
        />
      </div>
      <FormField label={term("hopeProducts")}>
        {({ id }) => (
          <OptionSelect
            id={id}
            label={term("hopeProducts")}
            placeholder={t("profile.hopeProductPlaceholder")}
            options={options?.hopeProducts ?? []}
            value={value.hopeProductIdx}
            onChangeValue={(idx) => changeKey("hopeProductIdx", idx)}
          />
        )}
      </FormField>
      <div className="grid grid-cols-2 items-end gap-2 *:min-w-0">
        <FormField label={t("profile.area")}>
          {({ id }) => (
            <OptionSelect
              id={id}
              label={t("profile.area")}
              placeholder={t("profile.areaPlaceholder")}
              options={parentAreas}
              value={parentAreaIdx}
              onChangeValue={(idx) => changeKey("areaIdx", idx)}
            />
          )}
        </FormField>
        <OptionSelect
          label={t("profile.subAreaPlaceholder")}
          placeholder={t("profile.subAreaPlaceholder")}
          options={subAreas}
          value={subAreaIdx}
          isDisabled={subAreas.length === 0}
          onChangeValue={(idx) => changeKey("areaIdx", idx)}
        />
      </div>
    </>
  );
}
