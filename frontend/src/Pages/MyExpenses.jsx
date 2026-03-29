import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

const statusColor = {
  draft: "text-gray-600 bg-gray-100",
  submitted: "text-indigo-600 bg-indigo-50",
  approved: "text-green-600 bg-green-50",
  rejected: "text-red-600 bg-red-50",
  pending: "text-yellow-600 bg-yellow-50",
  in_review: "text-blue-600 bg-blue-50",
};

const MyExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/expenses/my")
      .then((r) => setExpenses(r.data.expenses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Expenses</h1>
        <Link
          to="/expenses/submit"
          className="bg-gray-900 text-white px-4 py-2 rounded-sm text-sm hover:bg-gray-700 transition"
        >
          + New Expense
        </Link>
      </div>

      <div className="bg-white rounded-sm border overflow-hidden">
        {loading ? (
          <p className="p-8 text-sm text-gray-400">Loading...</p>
        ) : expenses.length === 0 ? (
          <p className="p-8 text-sm text-gray-400">
            No expenses submitted yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Base Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr
                  key={e.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3">
                    {e.currency} {e.amount}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {e.amount_in_base ? `${e.amount_in_base}` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(e.expense_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[e.status]}`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/expenses/${e.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default MyExpenses;
