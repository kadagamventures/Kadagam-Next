import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        { email }
      );
      setMessage(data.message);
      setTimeout(() => navigate("/staff/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Forgot Password?</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your email to receive a reset link.</p>

        {message && <p className="text-green-600 bg-green-100 p-2 rounded">{message}</p>}
        {error && <p className="text-red-500 bg-red-100 p-2 rounded">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-gray-600">Email Address</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-all duration-300"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

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

export default ForgotPassword;
