import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { toast } from "react-toastify";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "employee",
    managerId: "",
    isManagerApprover: false,
  });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchUsers = () => {
    api
      .get("/users")
      .then((r) => setUsers(r.data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const managers = users.filter(
    (u) => u.role === "manager" || u.role === "admin" || u.role === "director",
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", form);
      toast.success("User created");
      setShowForm(false);
      setForm({
        fullName: "",
        email: "",
        password: "",
        role: "employee",
        managerId: "",
        isManagerApprover: false,
      });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating user");
    }
  };

  const handleUpdate = async (id) => {
    try {
      await api.put(`/users/${id}`, editForm);
      toast.success("User updated");
      setEditId(null);
      fetchUsers();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gray-900 text-white px-4 py-2 rounded-sm text-sm hover:bg-gray-700 transition"
        >
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-sm borderp-4 mb-6 max-w-lg">
          <h2 className="font-semibold text-gray-700 mb-4">Create User</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            {[
              { label: "Full Name", name: "fullName", type: "text" },
              { label: "Email", name: "email", type: "email" },
              { label: "Password", name: "password", type: "password" },
            ].map(({ label, name, type }) => (
              <div key={name}>
                <label className="text-sm text-gray-600 mb-1 block">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[name]}
                  onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500"
                />
              </div>
            ))}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500 bg-white"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="director">Director</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Assign Manager
              </label>
              <select
                value={form.managerId}
                onChange={(e) =>
                  setForm({ ...form, managerId: e.target.value })
                }
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500 bg-white"
              >
                <option value="">-- None --</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isManagerApprover}
                onChange={(e) =>
                  setForm({ ...form, isManagerApprover: e.target.checked })
                }
              />
              Is Manager Approver (manager approves first)
            </label>
            <button
              type="submit"
              className="bg-gray-900 text-white rounded-sm py-2 text-sm hover:bg-gray-700 transition"
            >
              Create User
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-sm border overflow-hidden">
        {loading ? (
          <p className="p-8 text-sm text-gray-400">Loading...</p>
        ) : users.length === 0 ? (
          <p className="p-8 text-sm text-gray-400">No users yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Mgr Approver</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    {editId === u.id ? (
                      <select
                        value={editForm.role || u.role}
                        onChange={(e) =>
                          setEditForm({ ...editForm, role: e.target.value })
                        }
                        className="border rounded px-2 py-1 text-xs bg-white"
                      >
                        <option value="employee">employee</option>
                        <option value="manager">manager</option>
                        <option value="director">director</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-purple-50 text-purple-600"
                            : u.role === "manager"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {editId === u.id ? (
                      <select
                        value={editForm.managerId ?? u.manager_id ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            managerId: e.target.value || null,
                          })
                        }
                        className="border rounded px-2 py-1 text-xs bg-white"
                      >
                        <option value="">None</option>
                        {managers
                          .filter((m) => m.id !== u.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      u.manager_name || "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editId === u.id ? (
                      <input
                        type="checkbox"
                        checked={
                          editForm.isManagerApprover ?? u.is_manager_approver
                        }
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            isManagerApprover: e.target.checked,
                          })
                        }
                      />
                    ) : u.is_manager_approver ? (
                      "✓"
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {editId === u.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(u.id)}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-gray-400 hover:underline text-xs"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {u.role !== "admin" && (
                          <>
                            <button
                              onClick={() => {
                                setEditId(u.id);
                                setEditForm({});
                              }}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="text-red-500 hover:underline text-xs"
                            >
                              Delete
                            </button>
                          </>
                        )}
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

export default Users;
