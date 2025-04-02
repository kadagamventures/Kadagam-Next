import { Routes, Route } from "react-router-dom";
import PropTypes from "prop-types";
import StaffSidebar from "../components/staffSidebar";

/* Staff Pages */
import StaffProfile from "../pages/staffs/staffProfile";
import StaffDashboard from "../pages/staffs/staffDashboard";
import StaffReport from "../pages/staffs/staffReport";
import LeavePage from "../pages/staffs/leavePage";

/* Staff Task Management */
import StaffTasks from "../pages/staffs/StaffTask/staffTask";
import StaffAddTask from "../pages/staffs/StaffTask/staffAddtask";
import StaffTaskList from "../pages/staffs/StaffTask/staffTasklist";

/* Staff Project Management */
import StaffProject from "../pages/staffs/StaffProject/staffProject";
import StaffAddProject from "../pages/staffs/StaffProject/staffAddproject";
import StaffProjectList from "../pages/staffs/StaffProject/staffProjectlist";

/* Staff Management */
import StaffMain from "../pages/staffs/StaffStaffs/staffMain";
import StaffAdd from "../pages/staffs/StaffStaffs/staffAdd";
import StaffList from "../pages/staffs/StaffStaffs/staffList";

/* Office Rules Page */
import OfficeRules from "../pages/staffs/OfficeRules";

/* Authentication */
import ForgotPassword from "../pages/auth/forgotPassword"; // ✅ Import Forgot Password Page
import ResetPassword from "../pages/auth/resetPassword";   // ✅ Import Reset Password Page

/**
 * ✅ Staff Routes Layout
 * - Includes sidebar and dynamically loads staff-specific pages
 */
const StaffRoutes = ({ staffPermissions }) => (
  <div className="flex w-full">
    <StaffSidebar permissions={staffPermissions} />
    <div className="flex-grow p-4">
      <Routes>
        {/* 📌 Core Staff Pages */}
        <Route path="profile" element={<StaffProfile />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="reports" element={<StaffReport />} />
        <Route path="ask-leave" element={<LeavePage />} />

        {/* 📌 Task Management */}
        <Route path="tasks" element={<StaffTasks />} />
        <Route path="tasks/add" element={<StaffAddTask />} />
        <Route path="tasks/edit/:id" element={<StaffAddTask />} />
        <Route path="tasks/list" element={<StaffTaskList />} />

        {/* 📌 Project Management */}
        <Route path="projects" element={<StaffProject />} />
        <Route path="projects/add" element={<StaffAddProject />} />
        <Route path="projects/edit/:id" element={<StaffAddProject />} />
        <Route path="projects/list" element={<StaffProjectList />} />

        {/* 📌 Staff Management */}
        <Route path="manage-staff" element={<StaffMain />} />
        <Route path="staffs/add" element={<StaffAdd />} />
        <Route path="staffs/edit/:id" element={<StaffAdd />} />
        <Route path="staffs/list" element={<StaffList />} />

        {/* 📌 Office Rules */}
        <Route path="office-rules" element={<OfficeRules />} />
      </Routes>
    </div>
  </div>
);

StaffRoutes.propTypes = {
  staffPermissions: PropTypes.object.isRequired,
};

export default StaffRoutes;
