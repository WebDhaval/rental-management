import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

// ============ Area / Line Chart ============
interface AreaChartProps {
  data: { label: string; value: number; value2?: number }[];
  height?: number;
  color?: string;
  color2?: string;
  showGrid?: boolean;
  formatValue?: (v: number) => string;
  legend?: { label: string; color: string }[];
}

export function AreaChart({ data, height = 220, color = 'hsl(217 91% 60%)', color2, showGrid = true, formatValue, legend }: AreaChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 600;
  const padX = 40;
  const padY = 20;
  const gid = useId();

  const max = Math.max(...data.flatMap((d) => [d.value, d.value2 ?? 0])) * 1.15;
  const min = 0;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const x = (i: number) => padX + (i / (data.length - 1)) * chartW;
  const y = (v: number) => padY + chartH - ((v - min) / (max - min)) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1)} ${padY + chartH} L ${x(0)} ${padY + chartH} Z`;

  const line2Path = color2 ? data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value2 ?? 0)}`).join(' ') : '';
  const area2Path = color2 ? `${line2Path} L ${x(data.length - 1)} ${padY + chartH} L ${x(0)} ${padY + chartH} Z` : '';

  return (
    <div className="w-full">
      {legend && (
        <div className="flex items-center gap-4 mb-3">
          {legend.map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          {color2 && (
            <linearGradient id={`grad2-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color2} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color2} stopOpacity="0" />
            </linearGradient>
          )}
        </defs>
        {showGrid && Array.from({ length: 4 }).map((_, i) => {
          const gy = padY + (chartH / 3) * i;
          return <line key={i} x1={padX} y1={gy} x2={width - padX} y2={gy} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3 3" />;
        })}
        <path d={areaPath} fill={`url(#grad-${gid})`} />
        {color2 && <path d={area2Path} fill={`url(#grad2-${gid})`} />}
        {color2 && <path d={line2Path} fill="none" stroke={color2} strokeWidth="2" strokeDasharray="5 4" />}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={x(i) - chartW / data.length / 2}
              y={0}
              width={chartW / data.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            {hover === i && (
              <>
                <line x1={x(i)} y1={padY} x2={x(i)} y2={padY + chartH} stroke="hsl(var(--border))" strokeWidth="1" />
                <circle cx={x(i)} cy={y(d.value)} r="4" fill={color} stroke="hsl(var(--card))" strokeWidth="2" />
                {d.value2 !== undefined && color2 && (
                  <circle cx={x(i)} cy={y(d.value2)} r="4" fill={color2} stroke="hsl(var(--card))" strokeWidth="2" />
                )}
              </>
            )}
          </g>
        ))}
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={height - 4} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '10px' }}>
            {d.label}
          </text>
        ))}
      </svg>
      {hover !== null && (
        <div className="mt-1 flex justify-center">
          <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs shadow-soft">
            <span className="font-medium">{data[hover].label}</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="font-semibold" style={{ color }}>{formatValue ? formatValue(data[hover].value) : data[hover].value}</span>
            {data[hover].value2 !== undefined && (
              <>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="font-semibold" style={{ color: color2 }}>{formatValue ? formatValue(data[hover].value2!) : data[hover].value2}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Bar Chart ============
interface BarChartProps {
  data: { label: string; value: number; value2?: number }[];
  height?: number;
  color?: string;
  color2?: string;
  formatValue?: (v: number) => string;
  legend?: { label: string; color: string }[];
}

export function BarChart({ data, height = 220, color = 'hsl(217 91% 60%)', color2, formatValue, legend }: BarChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 600;
  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const max = Math.max(...data.flatMap((d) => [d.value, d.value2 ?? 0])) * 1.15;
  const barW = (chartW / data.length) * 0.6;

  return (
    <div className="w-full">
      {legend && (
        <div className="flex items-center gap-4 mb-3">
          {legend.map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {Array.from({ length: 4 }).map((_, i) => {
          const gy = padY + (chartH / 3) * i;
          return <line key={i} x1={padX} y1={gy} x2={width - padX} y2={gy} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3 3" />;
        })}
        {data.map((d, i) => {
          const cx = padX + (i + 0.5) * (chartW / data.length);
          const h = (d.value / max) * chartH;
          const h2 = d.value2 !== undefined ? (d.value2 / max) * chartH : 0;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {d.value2 !== undefined && (
                <rect
                  x={cx - barW / 2}
                  y={padY + chartH - h2}
                  width={barW}
                  height={h2}
                  rx="3"
                  fill={color2}
                  opacity={hover === null || hover === i ? 0.7 : 0.4}
                  className="transition-opacity"
                />
              )}
              <rect
                x={cx - barW / 2}
                y={padY + chartH - h}
                width={barW}
                height={h}
                rx="3"
                fill={color}
                opacity={hover === null || hover === i ? 1 : 0.5}
                className="transition-opacity"
              />
              <text x={cx} y={height - 4} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '10px' }}>
                {d.label}
              </text>
              {hover === i && (
                <text x={cx} y={padY + chartH - h - 6} textAnchor="middle" className="fill-foreground font-semibold" style={{ fontSize: '11px' }}>
                  {formatValue ? formatValue(d.value) : d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============ Donut Chart ============
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 180, thickness = 28, centerLabel, centerValue }: DonutChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((d) => {
    const fraction = total > 0 ? d.value / total : 0;
    const dash = fraction * circumference;
    const seg = { ...d, dash, offset, fraction };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={thickness} />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? thickness + 4 : thickness}
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={-s.offset}
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hover !== null ? (
            <>
              <span className="text-2xl font-bold">{data[hover].value}</span>
              <span className="text-xs text-muted-foreground">{data[hover].label}</span>
            </>
          ) : (
            <>
              {centerValue && <span className="text-2xl font-bold">{centerValue}</span>}
              {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
            </>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div
            key={i}
            className={cn('flex items-center gap-2 cursor-pointer transition-opacity', hover !== null && hover !== i && 'opacity-50')}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-sm text-muted-foreground">{d.label}</span>
            <span className="text-sm font-semibold ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Sparkline ============
export function Sparkline({ data, color = 'hsl(217 91% 60%)', height = 40, width = 120 }: { data: number[]; color?: string; height?: number; width?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const gid = useId();
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${gid})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
