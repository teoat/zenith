import React, { memo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface MetricSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

const TOOLTIP_STYLE = {
  background: 'rgba(0,0,0,0.8)',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '12px',
  color: '#fff'
} as const;

const MetricSparkline: React.FC<MetricSparklineProps> = memo(({ 
  data, 
  color = '#3b82f6', 
  height = 40,
  showTooltip = true 
}) => {
  // Transform array to chart data
  const chartData = data.map((value, index) => ({ 
    index, 
    value 
  }));

  return (
    <div 
      className="w-full"
      style={{ ['--chart-height' as string]: `${height}px`, height: 'var(--chart-height)' } as React.CSSProperties}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showTooltip && (
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={() => ''}
              formatter={((value: number) => [value.toLocaleString(), '']) as any}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${color.replace('#', '')})`}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

MetricSparkline.displayName = 'MetricSparkline';

export default MetricSparkline;
