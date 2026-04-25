import { subSeconds } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { IngestPresets } from "@/types";

export function ymdInZoneToUtcBoundsMs(ymdFrom: string, ymdTo: string, timeZone: string): { t0: number; t1: number } {
  const z = (timeZone || "UTC").trim() || "UTC";
  return {
    t0: fromZonedTime(`${ymdFrom}T00:00:00.000`, z).getTime(),
    t1: fromZonedTime(`${ymdTo}T23:59:59.999`, z).getTime(),
  };
}

export function computeIngestPresetsForZone(iana: string): IngestPresets {
  const z = (iana || "UTC").trim() || "UTC";
  const now = new Date();
  const todayYmd = formatInTimeZone(now, z, "yyyy-MM-dd");
  const startToday = fromZonedTime(`${todayYmd}T00:00:00.000`, z);
  const yesterdayYmd = formatInTimeZone(subSeconds(startToday, 1), z, "yyyy-MM-dd");
  const last7From = formatInTimeZone(new Date(startToday.getTime() - 6 * 24 * 60 * 60 * 1000), z, "yyyy-MM-dd");
  return { timezone: z, today: todayYmd, yesterday: yesterdayYmd, last7_from: last7From, last7_to: todayYmd };
}
