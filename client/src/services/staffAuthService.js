import axios from "axios";
import authService from "../services/authService"; // ✅ Token management for session handling

// ✅ API Base URL - Ensure correct staff authentication endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/auth/staff";

// ✅ Create Axios Instance with Configurations
const api = axios.create({
  baseURL: API_BASE_URL, // ✅ Correct API base for staff routes
  withCredentials: true, // ✅ Ensures cookies are sent/received for authentication
  timeout: 10000, // ⏰ 10-second timeout to avoid hanging requests
});

/**
 * ✅ Staff Login - Authenticates the staff
 * Ensures that 8-digit passwords are properly compared to their hashed version.
 */
const login = async (userData) => {
  try {
    console.log("🔹 Sending staff login request...", userData);

    const response = await api.post("/login", {
      loginId: userData.ident, // ✅ Supports both staffId & email
      password: userData.password, // ✅ Compares with hashed password in backend
    });

    console.log("✅ Server Response (Staff Login):", response.data);

    if (!response.data?.accessToken || !response.data?.user) {
      console.warn("⚠️ Missing expected data in server response.");
      throw new Error("Invalid response from server.");
    }

    // ✅ Store token, user details & role
    authService.storeToken(response.data.accessToken);
    authService.storeUser(response.data.user);
    authService.storeRole(response.data.user.role);

    return response.data; // ✅ Return user and token
  } catch (error) {
    console.error("❌ Staff login failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

/**
 * ✅ Staff Logout - Clears session and redirects
 */
const logout = async (navigate) => {
  try {
    console.log("🔹 Sending staff logout request...");
    await api.post("/logout");

    console.log("✅ Logout successful. Clearing session...");
    authService.clearSession?.();

    if (navigate) {
      navigate("/staff/login");
    } else {
      window.location.href = "/staff/login";
    }
  } catch (error) {
    console.error("❌ Logout failed:", error.response?.data || error.message);
  }
};

/**
 * ✅ Get Current Logged-In Staff Details
 */
const getCurrentUser = async () => {
  const token = authService.getToken?.();
  if (!token) {
    console.warn("⚠️ No token found. Staff is not authenticated.");
    return null;
  }

  try {
    console.log("🔹 Fetching current staff details...");
    const response = await api.get("/current-user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ Staff data retrieved:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching staff data:", error.response?.data || error.message);
    return null;
  }
};

/**
 * ✅ Request Password Reset - Sends reset email to staff
 */
const requestPasswordReset = async (email) => {
  try {
    console.log(`🔹 Sending password reset request for ${email}...`);
    const response = await api.post("/forgot-password", { email });
    console.log("✅ Password reset email sent:", response.data.message);
    return response.data;
  } catch (error) {
    console.error("❌ Error sending password reset email:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to send reset email.");
  }
};

/**
 * ✅ Reset Password - Resets staff password using token
 */
const resetPassword = async (token, newPassword) => {
  try {
    console.log("🔹 Resetting staff password...");
    const response = await api.post("/reset-password", { token, newPassword });
    console.log("✅ Password reset successful:", response.data.message);
    return response.data;
  } catch (error) {
    console.error("❌ Error resetting password:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Password reset failed.");
  }
};

/**
 * ✅ Refresh Token - Automatically refreshes access token
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expired. Attempting refresh...");

      try {
        const refreshResponse = await api.post("/refresh");

        console.log("✅ Token refreshed:", refreshResponse.data.accessToken);
        authService.storeToken(refreshResponse.data.accessToken);

        // ✅ Retry the original request with the new token
        error.config.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
        return api(error.config);
      } catch (refreshError) {
        console.error("❌ Token refresh failed. Redirecting to login...");

        authService.clearSession();
        window.location.href = "/staff/login";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * ✅ Export Staff Auth Service
 */
const staffAuthService = {
  login,
  logout,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
};

export default staffAuthService;
