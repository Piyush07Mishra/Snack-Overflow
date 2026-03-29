import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import api from "../api/axios";
import { Link } from "react-router-dom";

const statusColor = {
  approved: "text-green-600 bg-green-50",
  rejected: "text-red-600 bg-red-50",
  pending: "text-yellow-600 bg-yellow-50",
  in_review: "text-blue-600 bg-blue-50",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role === "admin") {
          const res = await api.get("/expenses/all");
          const expenses = res.data.expenses;
          setRecent(expenses.slice(0, 5));
          setStats({
            total: expenses.length,
            approved: expenses.filter((e) => e.status === "approved").length,
            rejected: expenses.filter((e) => e.status === "rejected").length,
            pending: expenses.filter((e) =>
              ["pending", "in_review"].includes(e.status),
            ).length,
          });
        } else if (user.role === "manager") {
          const [pendingRes, myRes] = await Promise.all([
            api.get("/expenses/pending"),
            api.get("/expenses/my"),
          ]);
          const all = [...pendingRes.data.expenses, ...myRes.data.expenses];
          setRecent(pendingRes.data.expenses.slice(0, 5));
          setStats({
            total: all.length,
            approved: myRes.data.expenses.filter((e) => e.status === "approved")
              .length,
            rejected: myRes.data.expenses.filter((e) => e.status === "rejected")
              .length,
            pending: pendingRes.data.expenses.length,
          });
        } else {
          const res = await api.get("/expenses/my");
          const expenses = res.data.expenses;
          setRecent(expenses.slice(0, 5));
          setStats({
            total: expenses.length,
            approved: expenses.filter((e) => e.status === "approved").length,
            rejected: expenses.filter((e) => e.status === "rejected").length,
            pending: expenses.filter((e) =>
              ["pending", "in_review"].includes(e.status),
            ).length,
          });
        }
      } catch (_) {}
    };
    fetchData();
  }, [user]);

  const cards = [
    { label: "Total", value: stats.total, color: "bg-gray-900 text-white" },
    {
      label: "Approved",
      value: stats.approved,
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      color: "bg-red-50 text-red-700",
    },
    {
      label: "Pending",
      value: stats.pending,
      color: "bg-yellow-50 text-yellow-700",
    },
  ];

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-400 mb-6">
        Welcome back, {user?.fullName}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-sm p-5 ${c.color}`}>
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm mt-1 opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-sm borderp-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Recent Expenses</h2>
          <Link
            to={
              user.role === "manager"
                ? "/approvals"
                : user.role === "admin"
                  ? "/expenses/all"
                  : "/expenses/my"
            }
            className="text-xs text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">No expenses yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="pb-2">Submitted by</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((e) => (
                <tr
                  key={e.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="py-2">{e.submitter_name}</td>
                  <td className="py-2">{e.category}</td>
                  <td className="py-2">
                    {e.currency} {e.amount}
                  </td>
                  <td className="py-2">
                    {new Date(e.expense_date).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[e.status]}`}
                    >
                      {e.status}
                    </span>
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

export default Dashboard;
