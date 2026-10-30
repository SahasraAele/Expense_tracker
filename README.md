# 💰 Expense Tracker (MERN)

A full stack web app to manage personal finances. Record income and expenses, organize them by category, filter by date, and see where your money goes with charts.

## Features
- Register and log in with JWT authentication (passwords hashed with bcrypt)
- Add, edit and delete income and expense transactions
- Filter by type, category, date range and note text, with pagination
- Month overview: money left, total earned and total spent
- Doughnut chart of spending by category and a 6-month income vs expense bar chart
- Responsive layout, keyboard accessible

## Tech Stack
- **Frontend:** React 18, Vite, React Router, Axios, Chart.js
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Auth:** JSON Web Tokens, bcryptjs

## Project Structure
```
expense-tracker/
├── server/
│   ├── config/db.js            MongoDB connection
│   ├── middleware/auth.js      JWT check
│   ├── models/                 User, Transaction
│   ├── routes/                 auth, transactions
│   ├── app.js                  Express app
│   ├── server.js               Entry point
│   └── .env                    Local settings (see below)
├── client/
│   └── src/
│       ├── components/         Overview, TransactionForm, Filters, TransactionList, Charts
│       ├── context/            AuthContext
│       ├── pages/              AuthPage, Dashboard
│       └── styles.css
└── package.json                Scripts that run both apps together
```

## Getting Started

**You need:** Node.js 18+ and MongoDB (either installed locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

1. **Install everything**
   ```bash
   npm run install-all
   ```
2. **Check `server/.env`**. It is already set up for a local MongoDB:
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
   JWT_SECRET=dev_only_secret_change_before_deploying_9f3a1c7e
   CLIENT_URL=http://localhost:5173
   ```
   Using Atlas? Replace `MONGO_URI` with your Atlas connection string.
3. **Start MongoDB** (skip if you use Atlas), for example `mongod`, or start the MongoDB service.
4. **Run the app**
   ```bash
   npm run dev
   ```
5. Open **http://localhost:5173**, create an account and start adding transactions.

The API runs on http://localhost:5000 and the React dev server proxies `/api` to it.

### Production build
```bash
npm run build
NODE_ENV=production npm start
```
The Express server then serves the built React app and the API from one URL.

## API

All `/api/transactions` routes need the header `Authorization: Bearer <token>`.

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in, returns a token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/transactions` | List. Query: `type`, `category`, `from`, `to`, `q`, `page`, `limit` |
| GET | `/api/transactions/summary?month=YYYY-MM` | Totals, spending by category, 6-month trend |
| POST | `/api/transactions` | Create |
| PUT | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |

## Deploying
- **Database:** MongoDB Atlas
- **Backend:** Render (set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`)
- **Frontend:** Vercel (set `VITE_API_URL` to your backend URL plus `/api`)

Use a long random `JWT_SECRET` in production, never the sample one.

## License
MIT. See [LICENSE](LICENSE).
