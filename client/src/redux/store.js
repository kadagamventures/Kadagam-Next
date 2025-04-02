import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web

import authReducer from "./slices/authSlice";
import projectReducer from "./slices/projectSlice";
import staffReducer from "./slices/staffSlice";
import taskReducer from "./slices/taskSlice";
import staffAuthReducer from "./slices/staffAuthslice";
import staffSidebarReducer from "./slices/staffAuthslice";
import leaveRequestReducer from "./slices/leaveRequestSlice";

// Safe LocalStorage Parsing
const safeParse = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === "undefined") return defaultValue;
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
};

/**
 * Persist Config - Only persist selected slices
 */
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "staffAuth", "staffSidebar", "leaveRequest"],
};

// Combine all reducers into a root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  projects: projectReducer,
  staff: staffReducer,
  tasks: taskReducer,
  staffAuth: staffAuthReducer,
  staffSidebar: staffSidebarReducer,
  leaveRequest: leaveRequestReducer,
});

// Create a persisted reducer using redux-persist
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Preloaded State
const preloadedState = {
  auth: {
    user: safeParse("user", null),
    isAuthenticated: !!localStorage.getItem("token"),
    status: "idle",
    error: null,
  },
  staffAuth: {
    user: safeParse("user", null),
    token: localStorage.getItem("token") || null,
    role: localStorage.getItem("role") || null,
    permissions: safeParse("permissions", []),
    loading: false,
    error: null,
  },
  leaveRequest: {
    loading: false,
    data: null,
    error: null,
  },
};

const store = configureStore({
  reducer: persistedReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Create persistor for redux-persist
export const persistor = persistStore(store);

export default store;
