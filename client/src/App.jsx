import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import AdminLogin from "./pages/auth/login";
import StaffLogin from "./pages/auth/staffLogin";
import AdminRoute from "./routes/adminRoute";
import StaffRoutes from "./routes/staffRoute";
import ForgotPassword from "./pages/auth/forgotPassword";
import ResetPassword from "./pages/auth/resetPassword";
import DataComponent from "./components/DataComponents"; // Example usage

function App() {
  const auth = useSelector((state) => state.auth);
  const [staffPermissions, setStaffPermissions] = useState([]);

  useEffect(() => {
    const storedPermissions =
      JSON.parse(localStorage.getItem("staffPermissions")) || [];
    setStaffPermissions(storedPermissions);
  }, []);

  return (
    <Router>
      <div className="flex flex-col font-sans bg-gray-100">
        

        <Routes>
          {/* ✅ Redirect "/" to login page */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />

          {/* ✅ Login Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/staff/login" element={<StaffLogin />} />

          {/* ✅ Authentication Routes (No Sidebar) */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ✅ Admin Panel */}
          <Route path="/admin/*" element={<AdminRoute />} />

          {/* ✅ Staff Panel */}
          <Route path="/staff/*" element={<StaffRoutes staffPermissions={staffPermissions} />} />

          {/* ✅ Example Data Component */}
          <Route path="/data" element={<DataComponent />} />

          {/* ✅ Catch-All Route */}
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
