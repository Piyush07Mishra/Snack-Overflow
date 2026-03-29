import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

const CATEGORIES = [
  "Travel",
  "Meals",
  "Accommodation",
  "Office Supplies",
  "Software",
  "Training",
  "Medical",
  "Other",
];

const SubmitExpense = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [form, setForm] = useState({
    amount: "",
    currency: user?.baseCurrency || "USD",
    category: "",
    description: "",
    expenseDate: "",
    receiptUrl: "",
    ruleId: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/rules")
      .then((r) => setRules(r.data.rules))
      .catch(() => {});
    fetch("https://restcountries.com/v3.1/all?fields=currencies")
      .then((r) => r.json())
      .then((data) => {
        const all = new Set();
        data.forEach((c) =>
          Object.keys(c.currencies || {}).forEach((k) => all.add(k)),
        );
        setCurrencies([...all].sort());
      })
      .catch(() => setCurrencies(["USD", "EUR", "GBP", "INR"]));
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/expenses", form);
      toast.success("Expense submitted!");
      navigate("/expenses/my");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Submit Expense
      </h1>
      <div className="bg-white rounded-sm borderp-4 max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">Amount</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500"
              />
            </div>
            <div className="w-28">
              <label className="text-sm text-gray-600 mb-1 block">
                Currency
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500 bg-white"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500 bg-white"
            >
              <option value="">-- Select category --</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Expense Date
            </label>
            <input
              type="date"
              name="expenseDate"
              value={form.expenseDate}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Receipt URL (optional)
            </label>
            <input
              type="url"
              name="receiptUrl"
              value={form.receiptUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          {rules.length > 0 && (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Approval Rule (optional)
              </label>
              <select
                name="ruleId"
                value={form.ruleId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500 bg-white"
              >
                <option value="">-- Default / Manager only --</option>
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.rule_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-gray-900 text-white rounded-sm py-2 text-sm hover:bg-gray-700 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Expense"}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default SubmitExpense;
