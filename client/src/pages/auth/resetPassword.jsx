import { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams(); // ✅ Extract token from URL
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * ✅ Handle Password Reset
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    // ✅ Validate password match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { token, newPassword }
      );
      setMessage(response.data.message);

      // ✅ Redirect to login after successful reset
      setTimeout(() => navigate("/staff/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Reset Password
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter your new password below.
        </p>

        {/* Success & Error Messages */}
        {message && <p className="text-green-600 bg-green-100 p-2 rounded">{message}</p>}
        {error && <p className="text-red-500 bg-red-100 p-2 rounded">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-gray-600">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password"
            />
          </div>

          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-gray-600">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-4">
          <button
            onClick={() => navigate("/staff/login")}
            className="text-blue-500 text-sm hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
