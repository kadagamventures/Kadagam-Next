import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

// ✅ Safe JSON parse from LocalStorage
const safeParse = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === "undefined") return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.warn(`⚠️ Error parsing LocalStorage key "${key}":`, error);
    return defaultValue;
  }
};

// ✅ Staff Login Thunk
export const loginStaff = createAsyncThunk(
  "staffAuth/loginStaff",
  async ({ ident, password }, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/auth/staff/login", {
        loginId: ident,  // Can be staffId (8XXX) or email
        password         // ✅ 8-digit plain text password, backend handles bcrypt
      });

      const { accessToken, user } = response.data;
      if (!accessToken || !user) throw new Error("Invalid server response.");

      // ✅ Store in localStorage for persistence
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);
      localStorage.setItem("permissions", JSON.stringify(user.permissions || []));

      return { user, token: accessToken };
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/staff/login";
      }
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

// ✅ Staff Logout Thunk
export const logoutStaff = createAsyncThunk("staffAuth/logoutStaff", async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("permissions");
  return null;
});

// ✅ Initial State
const initialState = {
  user: safeParse("user", null),
  token: localStorage.getItem("token") || null,
  role: localStorage.getItem("role") || null,
  permissions: safeParse("permissions", []),
  loading: false,
  error: null,
};

// ✅ Staff Auth Slice
const staffAuthSlice = createSlice({
  name: "staffAuth",
  initialState,
  reducers: {
    resetStaffState(state) {
      state.user = null;
      state.token = null;
      state.role = null;
      state.permissions = [];
      state.loading = false;
      state.error = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔄 Login Flow
      .addCase(loginStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
        state.permissions = action.payload.user.permissions || [];
        state.error = null;
      })
      .addCase(loginStaff.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.permissions = [];
        state.error = action.payload || "Login failed.";
      })
      // 🔄 Logout Flow
      .addCase(logoutStaff.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.permissions = [];
        state.loading = false;
        state.error = null;
      });
  },
});

// ✅ Export Actions & Reducer
export const { resetStaffState } = staffAuthSlice.actions;
export default staffAuthSlice.reducer;
