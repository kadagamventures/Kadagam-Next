import { Routes, Route } from "react-router-dom";
import AdminLogin from "../pages/auth/login";
import StaffLogin from "../pages/auth/StaffLogin";


/**
 * ✅ Authentication Routes
 * - Admin Login: `/admin/login`
 * - Staff Login: `/staff/login`
 * - Forgot Password: `/forgot-password`
 */
const AuthRoutes = () => {
  return (
    <Routes>
      {/* Admin Login Route */}
      <Route path="/admin/login" element={<AuthLayout><AdminLogin /></AuthLayout>} />

      {/* Staff Login Route */}
      <Route path="/staff/login" element={<AuthLayout><StaffLogin /></AuthLayout>} />
    </Routes>
  );
};

/**
 * ✅ Auth Layout Component - Centers Auth Pages
 */
const AuthLayout = ({ children }) => (
  <div className="flex items-center justify-center min-h-screen w-full">
    {children}
  </div>
);

export default AuthRoutes;
