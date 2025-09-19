const palette = [
  'hsl(var(--accent))',
  'rgba(237, 239, 242, 0.88)',
  'rgba(180, 187, 198, 0.7)',
  'rgba(124, 135, 152, 0.55)',
  'hsl(var(--pos))',
  'hsl(var(--warn))',
  'hsl(var(--neg))',
]

export const chartTheme = {
  palette,
  getSeriesColor: (index: number) => palette[index % palette.length],
  gridStroke: 'rgba(180, 187, 198, 0.18)',
  axisLabel: 'hsl(var(--text-3))',
  axisLine: 'rgba(38, 43, 54, 0.45)',
  tooltip: {
    backgroundColor: 'hsl(var(--bg-1))',
    borderColor: 'hsl(var(--border))',
    textColor: 'hsl(var(--text-1))',
  },
  legend: {
    textColor: 'hsl(var(--text-2))',
  },
  referenceLine: 'rgba(110, 168, 254, 0.45)',
}

export type ChartPaletteKey = keyof typeof chartTheme
