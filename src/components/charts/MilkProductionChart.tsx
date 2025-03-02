import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { MilkProductionWithAnimal } from '../../lib/types';

interface MilkProductionChartProps {
  data: MilkProductionWithAnimal[];
}

export function MilkProductionChart({ data }: MilkProductionChartProps) {
  const chartData = data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      date: format(parseISO(item.date), 'd MMM', { locale: tr }),
      amount: item.amount,
      quality: item.quality_score || 0
    }));

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="amount"
            stroke="#2563eb"
            name="Üretim (L)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="quality"
            stroke="#16a34a"
            name="Kalite"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}