import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Sidebar from "../components/sidebar";
import Dashboard from "../pages/admin/dashboard";
import TaskStatus from "../pages/admin/taskStatus";
import LeaveApproval from "../pages/admin/leaveApproval";

/* Project */
import Projects from "../pages/admin/adminproject/project";
import AddProject from "../pages/admin/adminproject/addProject";
import ProjectList from "../pages/admin/adminproject/projectList";

/* Staff */
import Staffs from "../pages/admin/adminstaff/staffs";
import AddStaff from "../pages/admin/adminstaff/addStaffs";
import AdminStaffList from "../pages/admin/adminstaff/staffsList";

/* Task */
import Task from "../pages/admin/admintask/task";
import AddTask from "../pages/admin/admintask/addTask";
import TaskList from "../pages/admin/admintask/taskList";

/* Reports */
import ReportTabs from "../pages/admin/ReportLayout/reportTabs";
import Reports from "../pages/admin/ReportLayout/reports";
import Attendance from "../pages/admin/ReportLayout/attendance";
import ReportTasks from "../pages/admin/ReportLayout/tasks";
import ReportProjects from "../pages/admin/ReportLayout/reportprojects";
import ReportStaff from "../pages/admin/ReportLayout/reportStaff";
import LeaveList from "../pages/admin/ReportLayout/leaveList";

/* Loading Screen */
const LoadingScreen = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p className="text-gray-700 text-lg">Loading...</p>
  </div>
);

const AdminRoutes = () => {
  const { user, role, isAuthenticated, authLoaded } = useAuth();

  if (!authLoaded) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || role !== "admin") {
    localStorage.clear();
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-grow p-4">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="daily-status" element={<TaskStatus />} />
          <Route path="leave-approval" element={<LeaveApproval />} />

          {/* Project */}
          <Route path="projects" element={<Projects />} />
          <Route path="projects/add" element={<AddProject />} />
          <Route path="projects/edit/:id" element={<AddProject />} />
          <Route path="projects/list" element={<ProjectList />} />

          {/* Staff */}
          <Route path="staffs" element={<Staffs />} />
          <Route path="staffs/add" element={<AddStaff />} />
          <Route path="staffs/edit/:id" element={<AddStaff />} />
          <Route path="staffs/list" element={<AdminStaffList />} />

          {/* Task */}
          <Route path="tasks" element={<Task />} />
          <Route path="tasks/add" element={<AddTask />} />
          <Route path="tasks/edit/:id" element={<AddTask />} />
          <Route path="tasks/list" element={<TaskList />} />

          {/* Reports */}
          <Route path="reports" element={<ReportTabs />}>
            <Route index element={<Reports />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="tasks" element={<ReportTasks />} />
            <Route path="projects" element={<ReportProjects />} />
            <Route path="staffs" element={<ReportStaff />} />
            <Route path="leave-list" element={<LeaveList />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
};

export default AdminRoutes;
