import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginStaff } from "../../redux/slices/staffAuthslice";
import { Eye, EyeOff } from "lucide-react";
import logo from "../../assets/kadagamlogo.png";

const StaffLogin = () => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.staffAuth);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const resultAction = await dispatch(loginStaff({ ident: loginId, password }));

      if (loginStaff.fulfilled.match(resultAction)) {
        const { role, permissions } = resultAction.payload.user;
        localStorage.setItem("role", role);
        localStorage.setItem("permissions", JSON.stringify(permissions || []));
        navigate("/staff/dashboard");
      }
    } catch (error) {
      console.error("❌ Login failed:", error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 text-center">
        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <img src={logo} alt="Logo" className="w-16 h-16" />
        </div>

        <h2 className="text-xl font-semibold text-gray-800">Staff Login</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your credentials to login</p>

        {error && (
          <p className="text-red-500 text-sm bg-red-100 p-2 rounded mb-4">{error}</p>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-gray-600">Email or Staff ID</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              placeholder="Enter Email or Staff ID"
            />
          </div>

          <div className="mb-4 text-left relative">
            <label className="block text-sm font-medium text-gray-600">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-blue-500 text-sm hover:underline"
          >
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
