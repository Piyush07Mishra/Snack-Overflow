import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const FULL_NAME_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [countries, setCountries] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    companyName: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,currencies")
      .then((r) => r.json())
      .then((data) => {
        const sorted = data
          .map((c) => ({
            name: c.name.common,
            currency: Object.keys(c.currencies || {})[0] || "USD",
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(sorted);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.country.trim())
      return toast.error("Name and country are required");
    if (!FULL_NAME_REGEX.test(form.fullName.trim()))
      return toast.error("Name can contain only letters and spaces");
    if (!EMAIL_REGEX.test(form.email.trim()))
      return toast.error("Enter a valid email address");
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword)
      return toast.error("Passwords do not match");

    const payload = {
      ...form,
      fullName: form.fullName.trim(),
      companyName: form.companyName.trim(),
      country: form.country.trim(),
      email: form.email.trim().toLowerCase(),
    };

    setLoading(true);
    try {
      const res = await api.post("/auth/signup", payload);
      login(res.data.user, res.data.token);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrency = countries.find(
    (c) => c.name === form.country,
  )?.currency;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-1">ReimburX</h1>
        <p className="text-center text-xs text-gray-400 mb-6">
          Create your company account — 1 admin per company
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: "Name", name: "fullName", type: "text" },
            { label: "Company Name", name: "companyName", type: "text" },
            { label: "Email", name: "email", type: "email" },
            { label: "Password", name: "password", type: "password" },
            {
              label: "Confirm Password",
              name: "confirmPassword",
              type: "password",
            },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className="text-sm text-gray-600 mb-1 block">
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                required
                pattern={name === "fullName" ? "[A-Za-z][A-Za-z .'-]*" : undefined}
                title={
                  name === "fullName"
                    ? "Use letters, spaces, apostrophes, periods, or hyphens only"
                    : undefined
                }
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500"
              />
            </div>
          ))}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Country</label>
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-500 bg-white"
            >
              <option value="">-- Select country --</option>
              {countries.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {selectedCurrency && (
              <p className="text-xs text-gray-400 mt-1">
                Base currency:{" "}
                <span className="text-gray-600 font-medium">
                  {selectedCurrency}
                </span>
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-gray-900 text-white rounded-sm py-2 text-sm hover:bg-gray-700 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Signup"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
