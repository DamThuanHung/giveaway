import { Injectable, Logger } from '@nestjs/common';

export type AnalyticsPeriod = 'day' | 'yesterday' | 'week' | 'month' | 'year';

export interface DayPoint { date: string; label: string; visitors: number; pageViews: number; requests: number }
export interface DownloadPoint { date: string; label: string; count: number }

export interface CfWebResult {
  visitors: number;
  pageViews: number;
  requests: number;
  byDay: DayPoint[];
}

@Injectable()
export class CloudflareAnalyticsService {
  private readonly logger = new Logger(CloudflareAnalyticsService.name);
  private readonly zoneId = process.env.CF_ZONE_ID || '';
  private readonly apiToken = process.env.CF_API_TOKEN || '';

  get configured() {
    return !!(this.zoneId && this.apiToken);
  }

  private shortDate(iso: string): string {
    // iso = "2026-05-17" → "17/5"
    const [, m, dd] = iso.split('-');
    return `${+dd}/${+m}`;
  }

  /// sinceVnDate / untilVnDate: YYYY-MM-DD theo múi giờ VN (UTC+7).
  /// Truyền từ getAnalytics() để CF dùng cùng kỳ với DB download data.
  async fetchWebAnalytics(period: AnalyticsPeriod, sinceVnDate: string, untilVnDate: string): Promise<CfWebResult | null> {
    if (!this.configured) return null;

    const useHourly = period === 'day';
    const query = useHourly
      ? `{ viewer { zones(filter:{zoneTag:"${this.zoneId}"}) { httpRequests1hGroups(
            filter:{datetime_geq:"${sinceVnDate}T00:00:00Z",datetime_leq:"${untilVnDate}T23:59:59Z"}
            limit:25) {
            dimensions{datetime} sum{pageViews requests} uniq{uniques} }}}}`
      : `{ viewer { zones(filter:{zoneTag:"${this.zoneId}"}) { httpRequests1dGroups(
            filter:{date_geq:"${sinceVnDate}",date_leq:"${untilVnDate}"}
            orderBy:[date_ASC] limit:370) {
            dimensions{date} sum{pageViews requests} uniq{uniques} }}}}`;

    try {
      const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiToken}` },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        this.logger.warn(`CF Analytics HTTP ${res.status}`);
        return null;
      }

      const json = await res.json() as any;
      if (json.errors?.length) {
        this.logger.warn('CF Analytics errors: ' + JSON.stringify(json.errors[0]?.message));
        return null;
      }

      const zones = json.data?.viewer?.zones;
      if (!zones?.length) return null;

      const groups = useHourly
        ? zones[0].httpRequests1hGroups
        : zones[0].httpRequests1dGroups;

      if (!groups) return null;

      const byDay: DayPoint[] = groups.map((g: any) => {
        const rawDate = useHourly ? g.dimensions.datetime : g.dimensions.date;
        const dateStr = rawDate?.slice(0, 10) ?? '';
        const label = useHourly
          ? (rawDate?.slice(11, 13) ?? '') + ':00'
          : this.shortDate(dateStr);
        return {
          date: dateStr,
          label,
          visitors: g.uniq?.uniques ?? 0,
          pageViews: g.sum?.pageViews ?? 0,
          requests: g.sum?.requests ?? 0,
        };
      });

      const totals = byDay.reduce(
        (acc, d) => ({ visitors: acc.visitors + d.visitors, pageViews: acc.pageViews + d.pageViews, requests: acc.requests + d.requests }),
        { visitors: 0, pageViews: 0, requests: 0 },
      );

      return { ...totals, byDay };
    } catch (e) {
      this.logger.error('CF Analytics fetch failed: ' + (e as Error).message);
      return null;
    }
  }

  // Group daily download points by period for chart
  groupDownloadPoints(
    rawPoints: { date: string; count: number }[],
    period: AnalyticsPeriod,
  ): DownloadPoint[] {
    if (period !== 'year') {
      return rawPoints.map(p => ({
        date: p.date,
        label: this.shortDate(p.date),
        count: p.count,
      }));
    }
    // Year: group by month
    const map = new Map<string, number>();
    for (const p of rawPoints) {
      const key = p.date.slice(0, 7); // "2026-05"
      map.set(key, (map.get(key) ?? 0) + p.count);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, count]) => {
        const [y, m] = k.split('-');
        return { date: k, label: `T${+m}/${y.slice(2)}`, count };
      });
  }
}
