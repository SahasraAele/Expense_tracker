import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatMoney, monthLabel } from '../utils.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PALETTE = ['#2547D0', '#B0305A', '#12785A', '#C98A12', '#6A4BC4', '#0F8FA3', '#8A5A3C', '#5B6874', '#D0568A'];
const INK = '#15202B';
const MUTED = '#5B6874';
const GRID = '#E1E6E2';

export default function Charts({ summary }) {
  const byCategory = summary?.byCategory || [];
  const trend = summary?.trend || [];
  const hasSpending = byCategory.length > 0;
  const hasTrend = trend.some((t) => t.income > 0 || t.expense > 0);

  const doughnutData = {
    labels: byCategory.map((c) => c.category),
    datasets: [
      {
        data: byCategory.map((c) => c.total),
        backgroundColor: byCategory.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: '#FBFCFB',
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: trend.map((t) => monthLabel(t.month)),
    datasets: [
      { label: 'Earned', data: trend.map((t) => t.income), backgroundColor: '#12785A', borderRadius: 3 },
      { label: 'Spent', data: trend.map((t) => t.expense), backgroundColor: '#B0305A', borderRadius: 3 },
    ],
  };

  const doughnutTooltip = { callbacks: { label: (ctx) => ` ${ctx.label}: ${formatMoney(ctx.parsed)}` } };
  const barTooltip = { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}` } };

  return (
    <>
      <section className="panel" aria-labelledby="cat-title">
        <h2 id="cat-title">Spending by category</h2>
        {hasSpending ? (
          <>
            <div className="chart chart-doughnut">
              <Doughnut
                data={doughnutData}
                options={{
                  maintainAspectRatio: false,
                  cutout: '62%',
                  plugins: {
                    legend: { position: 'bottom', labels: { color: INK, boxWidth: 12, font: { family: 'IBM Plex Sans' } } },
                    tooltip: doughnutTooltip,
                  },
                }}
              />
            </div>
          </>
        ) : (
          <p className="muted">No expenses this month yet.</p>
        )}
      </section>

      <section className="panel" aria-labelledby="trend-title">
        <h2 id="trend-title">Last 6 months</h2>
        {hasTrend ? (
          <div className="chart chart-bar">
            <Bar
              data={barData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { color: INK, boxWidth: 12, font: { family: 'IBM Plex Sans' } } },
                  tooltip: barTooltip,
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: MUTED } },
                  y: { beginAtZero: true, grid: { color: GRID }, ticks: { color: MUTED, maxTicksLimit: 5 } },
                },
              }}
            />
          </div>
        ) : (
          <p className="muted">Add a few transactions to see your monthly trend.</p>
        )}
      </section>
    </>
  );
}
