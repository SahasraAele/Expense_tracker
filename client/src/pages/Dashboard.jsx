import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Overview from '../components/Overview.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import TransactionList from '../components/TransactionList.jsx';
import Filters from '../components/Filters.jsx';
import Charts from '../components/Charts.jsx';
import { currentMonth, monthBounds } from '../utils.js';

const EMPTY_FILTERS = { q: '', type: '', category: '', from: '', to: '' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState(null);
  const [summary, setSummary] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  const usingRange = Boolean(filters.from || filters.to);

  // Wait briefly after typing in the search box before asking the server.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(filters.q), 300);
    return () => clearTimeout(id);
  }, [filters.q]);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/transactions/summary', { params: { month } });
      setSummary(data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [month]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const range = filters.from || filters.to ? { from: filters.from, to: filters.to } : monthBounds(month);
      const params = { page, limit: 8, ...range };
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (debouncedQ) params.q = debouncedQ;
      const { data } = await api.get('/transactions', { params });
      setList(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month, page, filters.type, filters.category, filters.from, filters.to, debouncedQ]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const updateFilters = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const changeMonth = (value) => {
    if (!value) return;
    setMonth(value);
    setPage(1);
  };

  const refresh = () => {
    loadSummary();
    loadList();
  };

  const handleSaved = () => {
    setEditing(null);
    refresh();
  };

  const handleEdit = (transaction) => {
    setEditing(transaction);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDelete = async (transaction) => {
    if (!window.confirm(`Delete this ${transaction.category} transaction? This can't be undone.`)) return;
    try {
      await api.delete(`/transactions/${transaction._id}`);
      if (editing?._id === transaction._id) setEditing(null);
      // Step back a page if that was the last item on this one.
      if (list?.items.length === 1 && page > 1) setPage(page - 1);
      else loadList();
      loadSummary();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <h1 className="brand">Expense Tracker</h1>
        <div className="topbar-right">
          <label className="month-picker">
            <span>Month</span>
            <input type="month" value={month} onChange={(e) => changeMonth(e.target.value)} />
          </label>
          <span className="who">{user?.name}</span>
          <button className="btn small" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <Overview summary={summary} month={month} />

      {error && (
        <p className="error banner" role="alert">
          {error}
        </p>
      )}

      <div className="layout">
        <main className="col-main">
          <section className="panel" aria-labelledby="list-title">
            <h2 id="list-title">Transactions</h2>
            <Filters
              filters={filters}
              onChange={updateFilters}
              onClear={() => {
                setFilters(EMPTY_FILTERS);
                setPage(1);
              }}
              usingRange={usingRange}
            />
            <TransactionList
              data={list}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPage={setPage}
            />
          </section>
        </main>

        <aside className="col-side">
          <div ref={formRef} className="scroll-anchor">
            <TransactionForm editing={editing} onSaved={handleSaved} onCancel={() => setEditing(null)} />
          </div>
          <Charts summary={summary} />
        </aside>
      </div>
    </div>
  );
}
