const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, '0');

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Validates and cleans a create/update body. Returns { error } or { data }.
function readBody(body) {
  const type = body.type;
  const amount = Number(body.amount);
  const category = String(body.category || '').trim();
  const note = String(body.note || '').trim();
  const date = parseDate(body.date);

  if (type !== 'income' && type !== 'expense') return { error: 'Choose income or expense.' };
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter an amount greater than 0.' };
  if (!category) return { error: 'Choose a category.' };
  if (!date) return { error: 'Enter a valid date.' };
  if (note.length > 200) return { error: 'Note must be 200 characters or fewer.' };

  return { data: { type, amount: Math.round(amount * 100) / 100, category, note, date } };
}

// Returns [start, end) of a "YYYY-MM" month in UTC. Falls back to the current month.
function monthRange(month) {
  let year;
  let monthIndex;
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month || '');
  if (match) {
    year = Number(match[1]);
    monthIndex = Number(match[2]) - 1;
  } else {
    const now = new Date();
    year = now.getUTCFullYear();
    monthIndex = now.getUTCMonth();
  }
  return {
    year,
    monthIndex,
    key: `${year}-${pad(monthIndex + 1)}`,
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

// GET /api/transactions/summary?month=YYYY-MM
router.get('/summary', async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const { year, monthIndex, key, start, end } = monthRange(req.query.month);
    const trendStart = new Date(Date.UTC(year, monthIndex - 5, 1));

    const [totalsAgg, categoryAgg, trendAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: start, $lt: end } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: start, $lt: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: trendStart, $lt: end } } },
        {
          $group: {
            _id: { y: { $year: '$date' }, m: { $month: '$date' }, type: '$type' },
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const sum = (type) => (totalsAgg.find((t) => t._id === type) || { total: 0 }).total;
    const income = sum('income');
    const expense = sum('expense');

    const trend = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(year, monthIndex - i, 1));
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      const pick = (type) =>
        (trendAgg.find((t) => t._id.y === y && t._id.m === m && t._id.type === type) || { total: 0 }).total;
      trend.push({ month: `${y}-${pad(m)}`, income: pick('income'), expense: pick('expense') });
    }

    res.json({
      month: key,
      income,
      expense,
      balance: income - expense,
      byCategory: categoryAgg.map((c) => ({ category: c._id, total: c.total })),
      trend,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions?type&category&from&to&q&page&limit
router.get('/', async (req, res, next) => {
  try {
    const { type, category, from, to, q } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const filter = { user: req.userId };
    if (type === 'income' || type === 'expense') filter.type = type;
    if (category) filter.category = String(category);
    if (q) filter.note = { $regex: escapeRegex(String(q).trim()), $options: 'i' };

    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate;
      if (toDate) filter.date.$lt = new Date(toDate.getTime() + DAY_MS); // "to" is inclusive
    }

    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions
router.post('/', async (req, res, next) => {
  try {
    const { error, data } = readBody(req.body);
    if (error) return res.status(400).json({ message: error });
    const transaction = await Transaction.create({ ...data, user: req.userId });
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { error, data } = readBody(req.body);
    if (error) return res.status(400).json({ message: error });
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      data,
      { new: true, runValidators: true }
    );
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ message: 'Transaction deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
