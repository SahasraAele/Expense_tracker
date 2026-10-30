import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api.js';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, todayISO, toDateInput } from '../utils.js';

const blank = () => ({ type: 'expense', amount: '', category: EXPENSE_CATEGORIES[0], date: todayISO(), note: '' });

export default function TransactionForm({ editing, onSaved, onCancel }) {
  const [form, setForm] = useState(blank());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Load the transaction being edited, or reset to a blank form.
  useEffect(() => {
    if (editing) {
      setForm({
        type: editing.type,
        amount: String(editing.amount),
        category: editing.category,
        date: toDateInput(editing.date),
        note: editing.note || '',
      });
    } else {
      setForm(blank());
    }
    setError('');
  }, [editing]);

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  // Keep a category that was saved earlier selectable while editing.
  const options = categories.includes(form.category) ? categories : [form.category, ...categories];

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const setType = (type) => {
    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setForm({ ...form, type, category: list.includes(form.category) ? form.category : list[0] });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!(Number(form.amount) > 0)) return setError('Enter an amount greater than 0.');
    setBusy(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await api.put(`/transactions/${editing._id}`, payload);
      else await api.post('/transactions', payload);
      setForm(blank());
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="form-title">
      <h2 id="form-title">{editing ? 'Edit transaction' : 'Add a transaction'}</h2>
      <form onSubmit={submit} noValidate>
        <div className="segmented" role="group" aria-label="Transaction type">
          <button
            type="button"
            className={form.type === 'expense' ? 'on expense' : ''}
            aria-pressed={form.type === 'expense'}
            onClick={() => setType('expense')}
          >
            Expense
          </button>
          <button
            type="button"
            className={form.type === 'income' ? 'on income' : ''}
            aria-pressed={form.type === 'income'}
            onClick={() => setType('income')}
          >
            Income
          </button>
        </div>

        <div className="row two">
          <label className="field">
            <span>Amount (₹)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={set('amount')}
              required
            />
          </label>
          <label className="field">
            <span>Date</span>
            <input type="date" value={form.date} onChange={set('date')} required />
          </label>
        </div>

        <label className="field">
          <span>Category</span>
          <select value={form.category} onChange={set('category')}>
            {options.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Note (optional)</span>
          <input value={form.note} onChange={set('note')} maxLength={200} placeholder="e.g. Groceries at the market" />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button className="btn primary" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add transaction'}
          </button>
          {editing && (
            <button type="button" className="btn" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
