import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { toast } from "react-toastify";

const statusColor = {
  submitted: "text-indigo-600 bg-indigo-50",
  pending: "text-yellow-600 bg-yellow-50",
  in_review: "text-blue-600 bg-blue-50",
};

const PendingApprovals = () => {
  const [expenses, setExpenses] = useState([]);
  const [comments, setComments] = useState({});
  const [actingId, setActingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPending = () => {
    setLoading(true);
    api
      .get("/expenses/pending")
      .then((r) => setExpenses(r.data.expenses))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (expenseId, action) => {
    setActingId(expenseId);
    try {
      await api.post(`/expenses/${expenseId}/action`, {
        action,
        comment: comments[expenseId] || "",
      });
      toast.success(`Expense ${action}`);
      setComments((prev) => ({ ...prev, [expenseId]: "" }));
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActingId(null);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Pending Approvals
      </h1>
      <div className="bg-white rounded-sm border overflow-hidden">
        {loading ? (
          <p className="p-8 text-sm text-gray-400">Loading...</p>
        ) : expenses.length === 0 ? (
          <p className="p-8 text-sm text-gray-400">No pending approvals.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Base Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Step</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr
                  key={e.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{e.submitter_name}</td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3">
                    {e.currency} {e.amount}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {e.amount_in_base || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(e.expense_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    Step {e.step_order}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[e.status] || "text-gray-600 bg-gray-100"}`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={comments[e.id] || ""}
                      onChange={(ev) =>
                        setComments((prev) => ({ ...prev, [e.id]: ev.target.value }))
                      }
                      placeholder="Optional comment"
                      className="w-40 border border-gray-300 rounded-sm px-2 py-1 text-xs outline-none focus:border-gray-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(e.id, "approved")}
                        disabled={actingId === e.id}
                        className="text-green-600 hover:underline text-xs disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(e.id, "rejected")}
                        disabled={actingId === e.id}
                        className="text-red-500 hover:underline text-xs disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
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

export default PendingApprovals;
