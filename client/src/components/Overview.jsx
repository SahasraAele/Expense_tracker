import { formatMoney, monthLabel } from '../utils.js';

export default function Overview({ summary, month }) {
  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  const balance = summary?.balance || 0;

  // Share of this month's income that has been spent (capped at 100%).
  let spentShare = 0;
  if (income > 0) spentShare = Math.min((expense / income) * 100, 100);
  else if (expense > 0) spentShare = 100;

  const overspent = balance < 0;

  return (
    <section className="overview" aria-label={`Overview for ${monthLabel(month, 'long')}`}>
      <div className="overview-main">
        <p className="overview-label">{overspent ? 'Overspent in' : 'Left in'} {monthLabel(month, 'long')}</p>
        <p className={`overview-balance ${overspent ? 'neg' : ''}`}>{formatMoney(balance)}</p>
      </div>

      <div className="overview-bar-wrap">
        <div
          className="overview-bar"
          role="img"
          aria-label={`${Math.round(spentShare)}% of income spent`}
        >
          <span className={`overview-bar-spent ${overspent ? 'over' : ''}`} style={{ width: `${spentShare}%` }} />
        </div>
        <div className="overview-legend">
          <span>
            <i className="dot spent" /> Spent <strong>{formatMoney(expense)}</strong>
          </span>
          <span>
            <i className="dot earned" /> Earned <strong>{formatMoney(income)}</strong>
          </span>
        </div>
      </div>
    </section>
  );
}
