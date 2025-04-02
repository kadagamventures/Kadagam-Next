import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance'; // Using global axios instance

/**
 * Fetch Staff Permissions - Ensures proper authentication
 * - Fetches permissions from `/staff/permissions`
 * - Expects the backend to return an object with a "permissions" property containing an array.
 */
export const fetchPermissions = createAsyncThunk(
  'staffSidebar/fetchPermissions',
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/staff/permissions');
      const permissionsData = response.data?.permissions;
      if (!Array.isArray(permissionsData)) {
        throw new Error("Invalid permissions data received.");
      }
      return permissionsData;
    } catch (error) {
      if (error.response?.status === 401) {
        return thunkAPI.rejectWithValue("Unauthorized - Please log in again.");
      }
      if (error.response?.status === 403) {
        return thunkAPI.rejectWithValue("Forbidden - You do not have access.");
      }
      return thunkAPI.rejectWithValue(error.response?.data || "Failed to fetch permissions");
    }
  }
);

/**
 * Fetch Active Attendance Session
 * - Checks if a staff member has an active work session.
 * - Expects the backend to return an object like { isWorking: boolean, checkInTime: <date> }.
 */
export const fetchActiveSession = createAsyncThunk(
  'staffSidebar/fetchActiveSession',
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/attendance/active-session');
      if (!response.data.isWorking) {
        return { isWorking: false, timer: 0 };
      }
      const checkInTime = new Date(response.data.checkInTime);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - checkInTime) / 1000);
      return { isWorking: true, timer: elapsedSeconds };
    } catch (error) {
      return thunkAPI.rejectWithValue("Failed to fetch active session");
    }
  }
);

// Initial Redux State for Staff Sidebar
const initialState = {
  permissions: [], // e.g., ["manage_staff", "manage_project", "manage_task"]
  isLoading: false, // Loading flag for permissions
  isWorking: false, // Work status (timer running)
  timer: 0,         // Timer value in seconds
  profileImage: null, // URL for profile image
  intervalId: null, // ID for the work timer interval
  error: null,      // Error message if any
};

const staffSidebarSlice = createSlice({
  name: 'staffSidebar',
  initialState,
  reducers: {
    setProfileImage: (state, action) => {
      state.profileImage = action.payload;
    },
    setIsWorking: (state, action) => {
      state.isWorking = action.payload;
    },
    incrementTimer: (state) => {
      state.timer += 1;
    },
    setTimer: (state, action) => {
      state.timer = action.payload;
    },
    setIntervalId: (state, action) => {
      state.intervalId = action.payload;
    },
    clearIntervalId: (state) => {
      state.intervalId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Permissions - Pending
      .addCase(fetchPermissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Fetch Permissions - Success
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload || [];
        state.isLoading = false;
        state.error = null;
      })
      // Fetch Permissions - Failure
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
        state.permissions = [];
      })
      // Fetch Active Attendance Session
      .addCase(fetchActiveSession.fulfilled, (state, action) => {
        state.isWorking = action.payload.isWorking;
        state.timer = action.payload.timer;
      });
  },
});

export const { 
  setProfileImage, 
  setIsWorking, 
  incrementTimer, 
  setTimer, 
  setIntervalId, 
  clearIntervalId 
} = staffSidebarSlice.actions;

export default staffSidebarSlice.reducer;
