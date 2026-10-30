import { formatDate, formatMoney } from '../utils.js';

export default function TransactionList({ data, loading, onEdit, onDelete, onPage }) {
  const { items = [], page = 1, pages = 1, total = 0 } = data || {};

  if (!loading && items.length === 0) {
    return (
      <div className="empty">
        <p>No transactions match.</p>
        <p>Add one with the form, or change the filters and month.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrap" aria-busy={loading}>
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Details</th>
              <th scope="col" className="num">
                Amount
              </th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t._id}>
                <td className="nowrap">{formatDate(t.date)}</td>
                <td>
                  <span className="cat">{t.category}</span>
                  {t.note && <span className="note">{t.note}</span>}
                </td>
                <td className={`num ${t.type === 'income' ? 'pos' : 'neg'}`}>
                  {t.type === 'income' ? '+' : '−'} {formatMoney(t.amount)}
                </td>
                <td className="actions">
                  <button className="link" onClick={() => onEdit(t)} aria-label={`Edit ${t.category} on ${formatDate(t.date)}`}>
                    Edit
                  </button>
                  <button
                    className="link danger"
                    onClick={() => onDelete(t)}
                    aria-label={`Delete ${t.category} on ${formatDate(t.date)}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span>
          {total} transaction{total === 1 ? '' : 's'}
        </span>
        <div>
          <button className="btn small" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Previous
          </button>
          <span className="pager-count">
            Page {page} of {pages}
          </span>
          <button className="btn small" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </>
  );
}
