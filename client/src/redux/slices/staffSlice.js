import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

const API_BASE_URL = "/admin/staff";

// Fetch Staff List (Excluding Admins) with cache-busting parameter
export const fetchStaffs = createAsyncThunk("staff/fetchStaffs", async (_, thunkAPI) => {
  try {
    const timestamp = new Date().getTime(); // Cache busting parameter
    const response = await axiosInstance.get(`${API_BASE_URL}?_=${timestamp}`);
    const filteredStaff = response.data.staffList.filter((staff) => staff.role !== "admin");
    return filteredStaff;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch staff.");
  }
});

// Add New Staff (Returns staff and rawPassword)
export const addStaff = createAsyncThunk("staff/addStaff", async (formData, thunkAPI) => {
  try {
    const response = await axiosInstance.post(API_BASE_URL, formData);
    // Expected response: { staff, rawPassword }
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to add staff.");
  }
});

// Update Staff
export const updateStaff = createAsyncThunk(
  "staff/updateStaff",
  async ({ id, formData }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("UpdateStaff response data:", response.data);
      // Use updatedStaff from the response if available, otherwise fallback to response.data
      const updatedStaff = response.data.updatedStaff ? response.data.updatedStaff : response.data;
      return updatedStaff;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update staff.");
    }
  }
);

// Delete Staff
export const deleteStaff = createAsyncThunk("staff/deleteStaff", async (id, thunkAPI) => {
  try {
    await axiosInstance.delete(`${API_BASE_URL}/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete staff.");
  }
});

// Fetch Staff By ID (For Editing or Viewing Profile)
export const fetchStaffById = createAsyncThunk("staff/fetchStaffById", async (id, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/${id}`);
    return response.data.staff;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch staff details.");
  }
});

// Get My Profile (Individual Staff View)
export const fetchMyProfile = createAsyncThunk("staff/fetchMyProfile", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/my-profile`);
    return response.data.profile;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch profile.");
  }
});

// Staff Slice Setup
const staffSlice = createSlice({
  name: "staff",
  initialState: {
    items: [],
    selectedStaff: null,
    myProfile: null,
    rawPassword: null,
    status: "idle",
    error: null,
  },
  reducers: {
    resetStaffStatus: (state) => {
      state.status = "idle";
      state.error = null;
      state.rawPassword = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Staff
      .addCase(fetchStaffs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStaffs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchStaffs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add Staff
      .addCase(addStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Add new staff to the beginning of the list
        state.items.unshift(action.payload.staff);
        state.rawPassword = action.payload.rawPassword;
      })
      .addCase(addStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update Staff
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = state.items.map((staff) =>
          staff._id === action.payload._id ? { ...staff, ...action.payload } : staff
        );
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete Staff
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = state.items.filter((staff) => staff._id !== action.payload);
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch Staff by ID
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        state.selectedStaff = action.payload;
      })
      .addCase(fetchStaffById.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch My Profile
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.myProfile = action.payload;
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { resetStaffStatus } = staffSlice.actions;
export default staffSlice.reducer;
