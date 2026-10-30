import { ALL_CATEGORIES } from '../utils.js';

export default function Filters({ filters, onChange, onClear, usingRange }) {
  const set = (field) => (e) => onChange({ [field]: e.target.value });

  return (
    <div className="filters">
      <label className="field">
        <span>Search notes</span>
        <input type="search" value={filters.q} onChange={set('q')} placeholder="Search" />
      </label>
      <label className="field">
        <span>Type</span>
        <select value={filters.type} onChange={set('type')}>
          <option value="">All</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
      </label>
      <label className="field">
        <span>Category</span>
        <select value={filters.category} onChange={set('category')}>
          <option value="">All</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>From</span>
        <input type="date" value={filters.from} onChange={set('from')} />
      </label>
      <label className="field">
        <span>To</span>
        <input type="date" value={filters.to} onChange={set('to')} />
      </label>
      <button type="button" className="btn" onClick={onClear}>
        Clear filters
      </button>
      {usingRange && <p className="filters-note">Using your date range instead of the selected month.</p>}
    </div>
  );
}
