import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const statusColor = {
  approved: "text-green-600 bg-green-50",
  rejected: "text-red-600 bg-red-50",
  pending: "text-yellow-600 bg-yellow-50",
  in_review: "text-blue-600 bg-blue-50",
};

const ExpenseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const fetchDetail = () => {
    api
      .get(`/expenses/${id}`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleAction = async (action) => {
    setActing(true);
    try {
      await api.post(`/expenses/${id}/action`, { action, comment });
      toast.success(`Expense ${action}`);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActing(false);
    }
  };

  if (loading)
    return (
      <Layout>
        <p className="text-gray-400">Loading...</p>
      </Layout>
    );
  if (!data)
    return (
      <Layout>
        <p className="text-gray-400">Expense not found.</p>
      </Layout>
    );

  const { expense, approvals } = data;
  const myApproval = approvals.find(
    (a) => a.approver_id === user.id && a.status === "pending",
  );

  return (
    <Layout>
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-400 hover:text-gray-600 mb-4"
      >
        ← Back
      </button>
      <div className="max-w-2xl">
        <div className="bg-white rounded-sm borderp-4 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {expense.category}
              </h1>
              <p className="text-sm text-gray-400">
                Submitted by {expense.submitter_name}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[expense.status]}`}
            >
              {expense.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Amount</p>
              <p className="font-medium">
                {expense.currency} {expense.amount}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Base Amount</p>
              <p className="font-medium">{expense.amount_in_base || "-"}</p>
            </div>
            <div>
              <p className="text-gray-400">Date</p>
              <p className="font-medium">
                {new Date(expense.expense_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Submitted</p>
              <p className="font-medium">
                {new Date(expense.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {expense.description && (
            <div className="mt-4">
              <p className="text-gray-400 text-sm">Description</p>
              <p className="text-sm mt-1">{expense.description}</p>
            </div>
          )}

          {expense.receipt_url && (
            <div className="mt-4">
              <a
                href={expense.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 text-sm hover:underline"
              >
                View Receipt
              </a>
            </div>
          )}
        </div>

        {/* Approval Timeline */}
        <div className="bg-white rounded-sm borderp-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4">
            Approval Timeline
          </h2>
          {approvals.length === 0 ? (
            <p className="text-sm text-gray-400">No approval steps.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {approvals.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      a.status === "approved"
                        ? "bg-green-500"
                        : a.status === "rejected"
                          ? "bg-red-500"
                          : "bg-gray-300"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {a.approver_name}{" "}
                      <span className="text-gray-400 font-normal">
                        — Step {a.step_order}
                      </span>
                    </p>
                    <p
                      className={`text-xs ${statusColor[a.status]?.split(" ")[0] || "text-gray-400"}`}
                    >
                      {a.status}
                    </p>
                    {a.comment && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        "{a.comment}"
                      </p>
                    )}
                    {a.acted_at && (
                      <p className="text-xs text-gray-400">
                        {new Date(a.acted_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action panel for manager/admin */}
        {myApproval && (
          <div className="bg-white rounded-sm borderp-4">
            <h2 className="font-semibold text-gray-700 mb-3">Your Action</h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)"
              rows={3}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500 resize-none mb-3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleAction("approved")}
                disabled={acting}
                className="flex-1 bg-green-600 text-white rounded-sm py-2 text-sm hover:bg-green-700 transition disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction("rejected")}
                disabled={acting}
                className="flex-1 bg-red-500 text-white rounded-sm py-2 text-sm hover:bg-red-600 transition disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExpenseDetail;
