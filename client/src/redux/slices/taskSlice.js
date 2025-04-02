import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

// ────────────────────────────────────────────────────────────
// ░░░ T H U N K S ░░░
// ────────────────────────────────────────────────────────────

// 1) Fetch All Tasks (Admin/permissioned staff)
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/tasks`);
      return response.data || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 2) Fetch Tasks for a Specific Staff
export const fetchStaffTasks = createAsyncThunk(
  "tasks/fetchStaffTasks",
  async (userId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/tasks/staff/${userId}`);
      return response.data || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 3) Add a New Task
export const addTask = createAsyncThunk(
  "tasks/addTask",
  async (formData, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/tasks`, formData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 4) Update an Existing Task
export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, formData }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/tasks/${id}`, formData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 5) Update Task Status (Staff Drag-Drop)
export const updateTaskStatusAction = createAsyncThunk(
  "tasks/updateTaskStatus",
  async ({ id, status, priority }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/tasks/staff/${id}`, {
        status,
        priority,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 6) Submit Daily Task Update (Comment)
export const submitDailyTaskUpdate = createAsyncThunk(
  "tasks/submitDailyUpdate",
  async ({ id, comment }, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/tasks/${id}/daily-comment`, {
        comment,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 7) Delete a Task
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/tasks/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 8) Fetch Kanban Tasks for Staff
export const fetchKanbanTasksForStaff = createAsyncThunk(
  "tasks/fetchKanbanTasksForStaff",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/tasks/kanban`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 9) Auto Adjust Task Priorities (Admin Only)
export const autoAdjustTaskPriorities = createAsyncThunk(
  "tasks/autoAdjustTaskPriorities",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/tasks/adjust-priorities`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 10) Mark Overdue Tasks (Admin Only)
export const markOverdueTasks = createAsyncThunk(
  "tasks/markOverdueTasks",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/tasks/mark-overdue`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// ────────────────────────────────────────────────────────────
// ░░░ S L I C E ░░░
// ────────────────────────────────────────────────────────────

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    items: [], // All tasks (admin/permissioned)
    staffTasks: [], // Staff-specific tasks
    kanbanTasks: { todo: [], ongoing: [], completed: [], overdue: [] }, // Kanban board
    status: "idle",
    error: null,
  },
  reducers: {
    resetStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ─────────────────────────────────────────────────────
      // FETCH TASKS
      .addCase(fetchTasks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ─────────────────────────────────────────────────────
      // FETCH STAFF TASKS
      .addCase(fetchStaffTasks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStaffTasks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.staffTasks = action.payload;
      })
      .addCase(fetchStaffTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ─────────────────────────────────────────────────────
      // ADD TASK
      .addCase(addTask.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items.push(action.payload);
      })
      .addCase(addTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ─────────────────────────────────────────────────────
      // UPDATE TASK
      .addCase(updateTask.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedTask = action.payload;
        const index = state.items.findIndex(
          (task) => task._id === updatedTask._id
        );
        if (index !== -1) {
          state.items[index] = updatedTask;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ─────────────────────────────────────────────────────
      // UPDATE TASK STATUS (DRAG-DROP)
      .addCase(updateTaskStatusAction.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateTaskStatusAction.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedTask = action.payload;
        const index = state.items.findIndex(
          (task) => task._id === updatedTask._id
        );
        if (index !== -1) {
          state.items[index] = updatedTask;
        }
      })
      .addCase(updateTaskStatusAction.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ─────────────────────────────────────────────────────
      // SUBMIT DAILY TASK UPDATE (COMMENT)
      .addCase(submitDailyTaskUpdate.pending, (state) => {
        state.status = "loading";
      })
      .addCase(submitDailyTaskUpdate.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedTask = action.payload;
        const index = state.items.findIndex(
          (task) => task._id === updatedTask._id
        );
        if (index !== -1) {
          state.items[index] = updatedTask;
        }
      })
      .addCase(submitDailyTaskUpdate.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ─────────────────────────────────────────────────────
      // DELETE TASK
      .addCase(deleteTask.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = state.items.filter(
          (task) => task._id !== action.payload
        );
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ─────────────────────────────────────────────────────
      // FETCH KANBAN TASKS FOR STAFF
      .addCase(fetchKanbanTasksForStaff.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchKanbanTasksForStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.kanbanTasks = action.payload;
      })
      .addCase(fetchKanbanTasksForStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ─────────────────────────────────────────────────────
      // AUTO ADJUST TASK PRIORITIES
      .addCase(autoAdjustTaskPriorities.pending, (state) => {
        state.status = "loading";
      })
      .addCase(autoAdjustTaskPriorities.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(autoAdjustTaskPriorities.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ─────────────────────────────────────────────────────
      // MARK OVERDUE TASKS
      .addCase(markOverdueTasks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(markOverdueTasks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(markOverdueTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetStatus } = taskSlice.actions;
export default taskSlice.reducer;
