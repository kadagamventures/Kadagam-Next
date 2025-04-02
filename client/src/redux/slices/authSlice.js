import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminAuthService from "../../services/adminAuthService";
import axios from "axios";

// Safe LocalStorage retrieval
const safeGetItem = (key, isJSON = false) => {
  try {
    const value = localStorage.getItem(key);
    if (!value || value === "undefined" || value === "null") return null;
    return isJSON ? JSON.parse(value) : value;
  } catch {
    return null;
  }
};

// Initial Auth State
const initialState = {
  user: safeGetItem("user", true),
  role: safeGetItem("role"),
  isAuthenticated: !!safeGetItem("user"),
  status: "idle",
  error: null,
  resetStatus: null,
};

// Admin Login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ loginId, password }, thunkAPI) => {
    try {
      const response = await adminAuthService.login({ loginId, password });
      if (!response?.user || !response?.accessToken) {
        return thunkAPI.rejectWithValue("Invalid response from server.");
      }
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("role", response.user.role);
      return { user: response.user, role: response.user.role };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed.");
    }
  }
);

// Admin Logout
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  await adminAuthService.logout();
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  return null;
});

// Forgot Password
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, thunkAPI) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
      return response.data.message;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to send reset link.");
    }
  }
);

// Reset Password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, newPassword }, thunkAPI) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, { token, newPassword });
      return response.data.message;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to reset password.");
    }
  }
);

// Auth Slice (Admin Only)
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.status = "loading"; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "success";
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
        state.status = "idle";
      })
      .addCase(forgotPassword.pending, (state) => {
        state.resetStatus = "loading";
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.resetStatus = "success";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.resetStatus = "failed";
        state.error = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.resetStatus = "loading";
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.resetStatus = "success";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetAuthState } = authSlice.actions;
export default authSlice.reducer;
