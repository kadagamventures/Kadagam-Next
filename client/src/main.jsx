import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from "react-toastify";  // <-- Import ToastContainer
import "react-toastify/dist/ReactToastify.css";
import store, { persistor } from "./redux/store.js";
import "./index.css";
import App from "./App.jsx";

const LoadingScreen = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p className="text-gray-700 text-lg">Loading App...</p>
  </div>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <App />
        {/* ✅ Add the ToastContainer here so it’s always available */}
        <ToastContainer />
      </PersistGate>
    </Provider>
  </StrictMode>
);
