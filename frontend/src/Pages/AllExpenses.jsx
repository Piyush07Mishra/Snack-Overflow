import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import { toast } from "react-toastify";

const statusColor = {
  draft: "text-gray-600 bg-gray-100",
  submitted: "text-indigo-600 bg-indigo-50",
  approved: "text-green-600 bg-green-50",
  rejected: "text-red-600 bg-red-50",
  pending: "text-yellow-600 bg-yellow-50",
  in_review: "text-blue-600 bg-blue-50",
};

const AllExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchExpenses = () => {
    api
      .get("/expenses/all")
      .then((r) => setExpenses(r.data.expenses))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOverride = async (id, status) => {
    try {
      await api.post(`/expenses/${id}/override`, { status });
      toast.success(`Expense ${status}`);
      fetchExpenses();
    } catch {
      toast.error("Override failed");
    }
  };

  const filtered =
    filter === "all" ? expenses : expenses.filter((e) => e.status === filter);

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        All Expenses
      </h1>

      <div className="flex gap-2 mb-4">
        {["all", "draft", "submitted", "pending", "in_review", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs border transition ${filter === s ? "bg-gray-900 text-white border-gray-900" : "text-gray-500 hover:bg-gray-100"}`}
          >
            {s === "in_review"
              ? "In Review"
              : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-sm border overflow-hidden">
        {loading ? (
          <p className="p-8 text-sm text-gray-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-sm text-gray-400">No expenses found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{e.submitter_name}</td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3">
                    {e.currency} {e.amount}
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
                  <td className="px-4 py-3 flex gap-2">
                    <Link
                      to={`/expenses/${e.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </Link>
                    {["pending", "in_review"].includes(e.status) && (
                      <>
                        <button
                          onClick={() => handleOverride(e.id, "approved")}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOverride(e.id, "rejected")}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
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

export default AllExpenses;
