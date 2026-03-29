import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
import Dashboard from "./Pages/Dashboard";
import SubmitExpense from "./Pages/SubmitExpense";
import MyExpenses from "./Pages/MyExpenses";
import AllExpenses from "./Pages/AllExpenses";
import ExpenseDetail from "./Pages/ExpenseDetail";
import PendingApprovals from "./Pages/PendingApprovals";
import Users from "./Pages/Users";
import ApprovalRules from "./Pages/ApprovalRules";

const App = () => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );

  return (
    <Routes>
      <Route
        path="/signin"
        element={!user ? <SignIn /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/signup"
        element={!user ? <SignUp /> : <Navigate to="/dashboard" />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/submit"
        element={
          <ProtectedRoute>
            <SubmitExpense />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/my"
        element={
          <ProtectedRoute>
            <MyExpenses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/:id"
        element={
          <ProtectedRoute>
            <ExpenseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/all"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AllExpenses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute roles={["admin", "manager"]}>
            <PendingApprovals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rules"
        element={
          <ProtectedRoute roles={["admin"]}>
            <ApprovalRules />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/signin"} />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
