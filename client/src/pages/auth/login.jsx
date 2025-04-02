import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../redux/slices/authSlice"; // Adjust to your correct slice path
import kadagamLogo from "../../assets/kadagamlogo.png";

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ loginId: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user, role } = useSelector((state) => state.auth);

  // Handle Input Change
  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle Login Submit
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!credentials.loginId || !credentials.password) {
      setError("Both Login ID and Password are required.");
      setLoading(false);
      return;
    }

    try {
      const actionResult = await dispatch(loginUser(credentials));

      const result = actionResult.payload;

      if (loginUser.fulfilled.match(actionResult)) {
        // Optional check: if role must be "admin"
        if (result.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          setError("Access denied. Only admins can log in.");
        }
      } else {
        setError(result || "Invalid response from server.");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg flex flex-col items-center">
        <div className="text-center mb-4">
          <img src={kadagamLogo} alt="Logo" className="mx-auto w-16" />
          <h3 className="text-xl font-extrabold mt-2">
            <span className="text-red-600">Kadagam</span>{" "}
            <span className="text-blue-900">Ventures</span>
          </h3>
        </div>

        <h3 className="text-lg font-bold text-center mb-2 text-blue-900">
          Admin Login
        </h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          Enter your ID or email and password to access the admin panel.
        </p>

        {error && (
          <p className="text-sm text-red-500 bg-red-100 p-2 rounded w-full text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div>
            <input
              type="text"
              name="loginId" // Now "loginId" instead of "ident"
              placeholder="Admin ID or Email"
              value={credentials.loginId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-blue-500"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
