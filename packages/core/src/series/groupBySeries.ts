import { useMemo } from "react";
import { useChartFrame } from "../contexts";
import { useCartesian } from "../contexts";

export type SeriesGroup<T> = {
  key: string;
  index: number;
  data: T[];
};

export function useSeriesGroups<T>(): SeriesGroup<T>[] {
  const { data } = useChartFrame();
  const { seriesAccessor, seriesKeys } = useCartesian();

  return useMemo(() => {
    if (!seriesAccessor || seriesKeys.length === 0) {
      return [{ key: "default", index: 0, data: data as T[] }];
    }
    return seriesKeys.map((key, index) => ({
      key,
      index,
      data: (data as T[]).filter((d) => seriesAccessor(d) === key),
    }));
  }, [data, seriesAccessor, seriesKeys]);
}
