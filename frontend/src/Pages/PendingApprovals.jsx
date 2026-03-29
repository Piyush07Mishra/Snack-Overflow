import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const PendingApprovals = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/expenses/pending")
      .then((r) => setExpenses(r.data.expenses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
                    <Link
                      to={`/expenses/${e.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Review
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

export default PendingApprovals;
