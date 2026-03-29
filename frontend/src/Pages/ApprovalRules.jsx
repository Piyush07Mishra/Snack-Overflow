import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { toast } from "react-toastify";

const AUTO_APPROVE_ROLES = ["", "manager", "director", "admin", "employee"];

const ApprovalRules = () => {
  const [rules, setRules] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    managerApprovalRequired: true,
    sequentialApproval: true,
    minApprovalsPercentage: "",
    autoApproveRole: "",
    specificApproverId: "",
    steps: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    Promise.all([api.get("/rules"), api.get("/rules/managers")])
      .then(([rulesRes, mgrsRes]) => {
        setRules(rulesRes.data.rules);
        setManagers(mgrsRes.data.managers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addStep = () =>
    setForm({
      ...form,
      steps: [
        ...form.steps,
        { stepOrder: form.steps.length + 1, approverId: "", approverRole: "" },
      ],
    });
  const updateStep = (i, field, val) => {
    const steps = [...form.steps];
    steps[i] = { ...steps[i], [field]: val };
    setForm({ ...form, steps });
  };
  const removeStep = (i) =>
    setForm({ ...form, steps: form.steps.filter((_, idx) => idx !== i) });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/rules", form);
      toast.success("Rule created");
      setShowForm(false);
      setForm({
        name: "",
        managerApprovalRequired: true,
        sequentialApproval: true,
        minApprovalsPercentage: "",
        autoApproveRole: "",
        specificApproverId: "",
        steps: [],
      });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating rule");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await api.delete(`/rules/${id}`);
      toast.success("Rule deleted");
      fetchAll();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Approval Rules</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gray-900 text-white px-4 py-2 rounded-sm text-sm hover:bg-gray-700 transition"
        >
          {showForm ? "Cancel" : "+ New Rule"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-sm borderp-4 mb-6 max-w-xl">
          <h2 className="font-semibold text-gray-700 mb-4">
            Create Approval Rule
          </h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Rule Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.managerApprovalRequired}
                  onChange={(e) =>
                    setForm({ ...form, managerApprovalRequired: e.target.checked })
                  }
                />
                Require manager approval first
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.sequentialApproval}
                  onChange={(e) =>
                    setForm({ ...form, sequentialApproval: e.target.checked })
                  }
                />
                Enforce sequential steps
              </label>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Minimum Approval Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.minApprovalsPercentage}
                onChange={(e) =>
                  setForm({ ...form, minApprovalsPercentage: e.target.value })
                }
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Auto-Approve Role (optional)
              </label>
              <select
                value={form.autoApproveRole}
                onChange={(e) => setForm({ ...form, autoApproveRole: e.target.value })}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500 bg-white"
              >
                {AUTO_APPROVE_ROLES.map((r) => (
                  <option key={r || "none"} value={r}>
                    {r || "-- None --"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Specific Approver (optional, auto-approves)
              </label>
              <select
                value={form.specificApproverId}
                onChange={(e) =>
                  setForm({ ...form, specificApproverId: e.target.value })
                }
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500 bg-white"
              >
                <option value="">-- Select --</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Steps */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-600">
                  Approval Steps (sequence)
                </label>
                <button
                  type="button"
                  onClick={addStep}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + Add Step
                </button>
              </div>
              {form.steps.map((step, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <span className="text-xs text-gray-400 w-6">{i + 1}.</span>
                  <select
                    value={step.approverId}
                    onChange={(e) =>
                      updateStep(i, "approverId", e.target.value)
                    }
                    className="flex-1 border border-gray-300 rounded-sm px-2 py-1.5 text-sm bg-white outline-none"
                  >
                    <option value="">-- Select approver --</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.role})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Role label"
                    value={step.approverRole}
                    onChange={(e) =>
                      updateStep(i, "approverRole", e.target.value)
                    }
                    className="w-28 border border-gray-300 rounded-sm px-2 py-1.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="text-red-400 text-xs hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="bg-gray-900 text-white rounded-sm py-2 text-sm hover:bg-gray-700 transition"
            >
              Create Rule
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-gray-400">
            No approval rules defined yet.
          </p>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-sm border p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{rule.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {rule.sequential_approval ? "Sequential" : "Parallel"}
                    {(rule.min_approvals_percentage || rule.percentage_threshold)
                      ? ` — ${rule.min_approvals_percentage || rule.percentage_threshold}% threshold`
                      : ""}
                    {rule.manager_approval_required ? " — Manager required" : ""}
                    {rule.auto_approve_role
                      ? ` — Auto role: ${rule.auto_approve_role}`
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-red-400 text-xs hover:text-red-600"
                >
                  Delete
                </button>
              </div>
              {rule.steps?.length > 0 && (
                <div className="mt-3 flex flex-col gap-1">
                  {rule.steps.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <span className="text-gray-400 text-xs">
                        Step {s.step_order}
                      </span>
                      <span>{s.approver_name}</span>
                      {s.approver_role && (
                        <span className="text-xs text-gray-400">
                          ({s.approver_role})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default ApprovalRules;
