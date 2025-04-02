import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

// ---------------------------
// 🔹 Permission Utility Functions
// ---------------------------
const getStoredData = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored && stored !== "undefined" ? JSON.parse(stored) : defaultValue;
  } catch (err) {
    console.error(`🔴 Error parsing ${key}:`, err);
    return defaultValue;
  }
};

const user = getStoredData("user", null);
const permissions = getStoredData("permissions", []);

const hasPermission = (requiredPermission) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return permissions.includes(requiredPermission);
};

// ---------------------------
// 🔹 Async Thunks for CRUD Operations
// ---------------------------

// ✅ Fetch All Projects
export const fetchProjects = createAsyncThunk("projects/fetchProjects", async (_, thunkAPI) => {
  try {
    const { data } = await axiosInstance.get("/projects");
    return data.projects || [];
  } catch (error) {
    console.error("❌ Fetch projects error:", error);
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error.message || "Failed to fetch projects.");
  }
});

// ✅ Fetch Project by ID
export const fetchProjectById = createAsyncThunk("projects/fetchProjectById", async (id, thunkAPI) => {
  if (!id) return thunkAPI.rejectWithValue("❌ Invalid project ID.");
  try {
    const { data } = await axiosInstance.get(`/projects/${id}`);
    return data.project;
  } catch (error) {
    console.error("🔴 Fetch project error:", error);
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error.message || "Failed to fetch project.");
  }
});

// ✅ Add New Project
export const addProject = createAsyncThunk("projects/addProject", async (projectData, thunkAPI) => {
  if (!hasPermission("manage_project")) return thunkAPI.rejectWithValue("❌ Access denied: No permission to add projects.");
  try {
    const { data } = await axiosInstance.post("/projects", projectData);
    return data.project;
  } catch (error) {
    console.error("🔴 Add project error:", error);
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error.message || "Failed to add project.");
  }
});

// ✅ Update Project
export const updateProject = createAsyncThunk("projects/updateProject", async ({ id, ...projectData }, thunkAPI) => {
  if (!id) return thunkAPI.rejectWithValue("❌ Invalid project ID.");
  if (!hasPermission("manage_project")) return thunkAPI.rejectWithValue("❌ Access denied: No permission to update projects.");
  try {
    const { data } = await axiosInstance.put(`/projects/${id}`, projectData);
    console.log("✅ Updated Project Response:", data); // Debug API response
    return data.updatedProject;
  } catch (error) {
    console.error("🔴 Update project error:", error);
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error.message || "Failed to update project.");
  }
});

// ✅ Soft Delete Project
export const deleteProject = createAsyncThunk("projects/deleteProject", async (id, thunkAPI) => {
  if (!id) return thunkAPI.rejectWithValue("❌ Invalid project ID.");
  if (!hasPermission("manage_project")) return thunkAPI.rejectWithValue("❌ Access denied: No permission to delete projects.");
  try {
    await axiosInstance.delete(`/projects/${id}`);
    return id;
  } catch (error) {
    console.error("🔴 Delete project error:", error);
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error.message || "Failed to delete project.");
  }
});

// ✅ Restore Soft Deleted Project
export const restoreProject = createAsyncThunk("projects/restoreProject", async (id, thunkAPI) => {
  if (!id) return thunkAPI.rejectWithValue("❌ Invalid project ID.");
  if (!hasPermission("manage_project")) return thunkAPI.rejectWithValue("❌ Access denied: No permission to restore projects.");
  try {
    const { data } = await axiosInstance.put(`/projects/${id}/restore`);
    return data.project;
  } catch (error) {
    console.error("🔴 Restore project error:", error);
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error.message || "Failed to restore project.");
  }
});

// ---------------------------
// 🔹 Project Slice - Redux Toolkit
// ---------------------------
const projectSlice = createSlice({
  name: "projects",
  initialState: {
    items: [],
    selectedProject: null,
    status: "idle",
    error: null,
  },
  reducers: {
    resetStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    resetSelectedProject: (state) => {
      state.selectedProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Fetch All Projects
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // ✅ Fetch Single Project
      .addCase(fetchProjectById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // ✅ Add Project
      .addCase(addProject.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addProject.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items.unshift(action.payload);
      })
      .addCase(addProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // ✅ Update Project (Fix: Update selectedProject too)
      .addCase(updateProject.fulfilled, (state, action) => {
        state.items = state.items.map((proj) => (proj._id === action.payload._id ? action.payload : proj));
        if (state.selectedProject && state.selectedProject._id === action.payload._id) {
          state.selectedProject = action.payload;
        }
      })
      // ✅ Delete Project
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((proj) => proj._id !== action.payload);
      })
      // ✅ Restore Project
      .addCase(restoreProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  },
});

export const { resetStatus, resetSelectedProject } = projectSlice.actions;
export default projectSlice.reducer;
