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

  // Client tự động không phải khách thật: bot tìm kiếm/mạng xã hội, công cụ kiểm tra site,
  // script (kể cả script của chính VPS gọi web qua Cloudflare, user-agent chỉ là "node"),
  // và user-agent rỗng. [từ dữ liệu CF 2026-11-10: 398/413 request "từ VN" là chính VPS]
  private static readonly BOT_UA =
    /bot|crawl|spider|slurp|check|monitor|uptime|facebookexternalhit|externalagent|curl|wget|python|go-http|java\/|headless|^node$|^$/i;

  /// Báo cáo hôm qua: CHỈ đếm khách từ Việt Nam (yêu cầu của chủ dự án 2026-11-11), loại bot/script.
  /// Dùng httpRequestsAdaptiveGroups (có clientCountryName/userAgent) thay cho httpRequests1dGroups
  /// (chỉ có tổng, không lọc được). Khung giờ chính xác 00:00–24:00 giờ VN của `vnDate`.
  /// visitors = số IP khác nhau; pageViews = trang HTML trả 200; requests = mọi request đã lọc.
  private async fetchVietnamDay(vnDate: string): Promise<CfWebResult | null> {
    const startMs = new Date(`${vnDate}T00:00:00+07:00`).getTime();
    if (Number.isNaN(startMs)) return null;
    const from = new Date(startMs).toISOString();
    const to = new Date(startMs + 86400000).toISOString();
    const base = `datetime_geq:"${from}",datetime_lt:"${to}",clientCountryName:"VN",requestSource:"eyeball"`;
    const group = (extra: string) =>
      `httpRequestsAdaptiveGroups(filter:{${base}${extra}},limit:5000){ count dimensions{clientIP userAgent} }`;
    const query = `{ viewer { zones(filter:{zoneTag:"${this.zoneId}"}) {
      all: ${group('')}
      pages: ${group(',edgeResponseContentTypeName:"html",edgeResponseStatus:200')}
    }}}`;

    try {
      const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiToken}` },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) {
        this.logger.warn(`CF Analytics (VN) HTTP ${res.status}`);
        return null;
      }
      const json = await res.json() as any;
      if (json.errors?.length) {
        this.logger.warn('CF Analytics (VN) errors: ' + JSON.stringify(json.errors[0]?.message));
        return null;
      }
      const zone = json.data?.viewer?.zones?.[0];
      if (!zone) return null;

      const human = (g: any) => !CloudflareAnalyticsService.BOT_UA.test((g.dimensions?.userAgent ?? '').trim());
      const allHuman: any[] = (zone.all ?? []).filter(human);
      const pagesHuman: any[] = (zone.pages ?? []).filter(human);

      const visitors = new Set(allHuman.map((g) => g.dimensions.clientIP)).size;
      const requests = allHuman.reduce((s, g) => s + g.count, 0);
      const pageViews = pagesHuman.reduce((s, g) => s + g.count, 0);

      return {
        visitors,
        pageViews,
        requests,
        byDay: [{ date: vnDate, label: this.shortDate(vnDate), visitors, pageViews, requests }],
      };
    } catch (e) {
      this.logger.error('CF Analytics (VN) fetch failed: ' + (e as Error).message);
      return null;
    }
  }

  /// sinceVnDate / untilVnDate: YYYY-MM-DD theo múi giờ VN (UTC+7).
  /// Truyền từ getAnalytics() để CF dùng cùng kỳ với DB download data.
  async fetchWebAnalytics(period: AnalyticsPeriod, sinceVnDate: string, untilVnDate: string): Promise<CfWebResult | null> {
    if (!this.configured) return null;

    // 'yesterday' chỉ do mail báo cáo hàng ngày dùng → số liệu riêng Việt Nam, đã loại bot.
    if (period === 'yesterday') return this.fetchVietnamDay(sinceVnDate);

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
