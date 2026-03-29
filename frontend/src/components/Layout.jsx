import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const navLinks = {
  admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/users", label: "Users" },
    { to: "/expenses/all", label: "All Expenses" },
    { to: "/rules", label: "Approval Rules" },
  ],
  manager: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/approvals", label: "Pending Approvals" },
    { to: "/expenses/my", label: "My Expenses" },
  ],
  employee: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/expenses/submit", label: "Submit Expense" },
    { to: "/expenses/my", label: "My Expenses" },
  ],
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/signin");
  };

  const links = navLinks[user?.role] || [];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col py-6 px-4 gap-2 shrink-0">
        <div className="mb-6">
          <p className="text-lg font-bold text-gray-900">ReimburX</p>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {user?.companyName}
          </p>
          <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role}</p>
        </div>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`px-3 py-2 rounded-sm text-sm transition ${
              location.pathname === l.to
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <div className="mt-auto">
          <p className="text-xs text-gray-400 truncate mb-1">
            {user?.fullName}
          </p>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-sm text-sm text-red-500 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
};

export default Layout;
