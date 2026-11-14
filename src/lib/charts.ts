import { escapeHtml, formatRupiah } from './formatters';

export interface DailyChartBar {
  label: string;
  primary: number;
  secondary?: number;
  count?: number;
}

export interface DailyChartOptions {
  primaryLabel: string;
  secondaryLabel?: string;
  emptyText?: string;
}

/**
 * Render a lightweight, theme-aware 14-day bar sparkchart as inline SVG (zero external deps).
 */
export function renderDailyRevenueChartSvg(
  bars: DailyChartBar[],
  options: DailyChartOptions
): string {
  if (!Array.isArray(bars) || bars.length === 0) {
    return `<p class="text-xs font-mono text-neutral-500 dark:text-muted-gray py-8 text-center">${escapeHtml(
      options.emptyText || 'Belum ada data transaksi dalam 14 hari terakhir.'
    )}</p>`;
  }

  const maxVal = Math.max(
    1,
    ...bars.map((b) => Math.max(Number(b.primary || 0), Number(b.secondary || 0)))
  );
  const allZero = bars.every((b) => Number(b.primary || 0) <= 0 && Number(b.secondary || 0) <= 0);

  const width = 760;
  const height = 210;
  const padTop = 18;
  const padBottom = 34;
  const padLeft = 12;
  const padRight = 12;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const slotW = plotW / bars.length;
  const hasSecondary = Boolean(options.secondaryLabel);
  const primaryBarW = hasSecondary ? Math.max(10, Math.min(24, slotW * 0.42)) : Math.max(14, Math.min(34, slotW * 0.56));
  const secondaryBarW = hasSecondary ? Math.max(6, Math.min(12, slotW * 0.22)) : 0;

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const y = (padTop + plotH * (1 - ratio)).toFixed(1);
      return `<line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="currentColor" class="text-neutral-200 dark:text-white/10" stroke-dasharray="3 4" stroke-width="1" />`;
    })
    .join('');

  const barEls = bars
    .map((b, idx) => {
      const primaryVal = Math.max(0, Number(b.primary || 0));
      const secondaryVal = Math.max(0, Number(b.secondary || 0));
      const count = Number(b.count || 0);
      const centerX = padLeft + slotW * idx + slotW / 2;

      const pHeight = allZero ? 2 : Math.max(primaryVal > 0 ? 4 : 2, (primaryVal / maxVal) * plotH);
      const pY = padTop + plotH - pHeight;
      const pX = hasSecondary ? centerX - (primaryBarW + secondaryBarW + 3) / 2 : centerX - primaryBarW / 2;

      const tooltip = `${b.label} • ${options.primaryLabel}: ${formatRupiah(primaryVal)}${
        hasSecondary ? ` • ${options.secondaryLabel}: ${formatRupiah(secondaryVal)}` : ''
      } • ${count} order`;

      const primaryOpacity = primaryVal > 0 ? '1' : '0.22';
      const primaryRect = `<rect x="${pX.toFixed(1)}" y="${pY.toFixed(1)}" width="${primaryBarW.toFixed(1)}" height="${pHeight.toFixed(1)}" rx="4" fill="#D14D91" fill-opacity="${primaryOpacity}"><title>${escapeHtml(tooltip)}</title></rect>`;

      let secondaryRect = '';
      if (hasSecondary) {
        const sHeight = allZero ? 2 : Math.max(secondaryVal > 0 ? 4 : 2, (secondaryVal / maxVal) * plotH);
        const sY = padTop + plotH - sHeight;
        const sX = pX + primaryBarW + 3;
        const secOpacity = secondaryVal > 0 ? '1' : '0.22';
        secondaryRect = `<rect x="${sX.toFixed(1)}" y="${sY.toFixed(1)}" width="${secondaryBarW.toFixed(1)}" height="${sHeight.toFixed(1)}" rx="3" fill="#10B981" fill-opacity="${secOpacity}"><title>${escapeHtml(tooltip)}</title></rect>`;
      }

      const showLabel = bars.length <= 10 || idx % 2 === 0 || idx === bars.length - 1;
      const labelEl = showLabel
        ? `<text x="${centerX.toFixed(1)}" y="${(height - 10).toFixed(1)}" text-anchor="middle" font-size="10" font-family="ui-monospace, monospace" fill="currentColor" class="text-neutral-500 dark:text-muted-gray">${escapeHtml(b.label)}</text>`
        : '';

      return `<g>${primaryRect}${secondaryRect}${labelEl}</g>`;
    })
    .join('');

  const legend = `
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3 text-[11px] font-mono text-neutral-600 dark:text-muted-gray">
      <div class="flex flex-wrap items-center gap-4">
        <span class="inline-flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-sm bg-electric-magenta inline-block"></span>
          ${escapeHtml(options.primaryLabel)}
        </span>
        ${
          hasSecondary
            ? `<span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>${escapeHtml(options.secondaryLabel || '')}</span>`
            : ''
        }
      </div>
      <span>Skala puncak harian: ${escapeHtml(allZero ? 'Rp 0' : formatRupiah(maxVal))}</span>
    </div>
  `;

  return `
    ${legend}
    <svg viewBox="0 0 ${width} ${height}" class="w-full min-w-[540px] h-52 overflow-visible" role="img" aria-label="${escapeHtml(options.primaryLabel)}">
      ${gridLines}
      ${barEls}
    </svg>
  `;
}
