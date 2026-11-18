const TICK_INTERVALS = 4;
const NICE_STEPS = [1, 2, 2.5, 5, 10];

/** y축을 같은 간격 4칸(눈금 5개: 0·50·100·150·200처럼)으로 나누는 간격과 눈금. 최댓값이 0이어도 눈금은 그려짐. */
export function getYAxisTicks(maxValue: number): number[] {
  const raw = Math.max(maxValue, 1) / TICK_INTERVALS;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    NICE_STEPS.map((nice) => nice * magnitude).find((value) => value >= raw) ??
    10 * magnitude;
  const integerStep = Math.max(1, Math.ceil(step));
  return Array.from(
    { length: TICK_INTERVALS + 1 },
    (_, index) => index * integerStep,
  );
}
