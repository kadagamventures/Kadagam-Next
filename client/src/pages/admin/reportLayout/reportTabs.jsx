import { NavLink, Outlet } from "react-router-dom";

const ReportTabs = () => {
  const tabs = [
    { name: "Overview", path: "/admin/reports" },
    { name: "Attendance", path: "/admin/reports/attendance" },
    { name: "Task", path: "/admin/reports/tasks" },
    { name: "Project", path: "/admin/reports/Projects" },
    { name: "Staff", path: "/admin/reports/staffs" },
    { name: "LeaveList", path: "/admin/reports/Leave-list" },
  ];

  return (
    <div className="pl-64 pr-8 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Fixed Report Tabs */}
      <div className="fixed top-0 left-64 right-8 bg-white shadow-lg z-50 p-5">
        <nav className="flex space-x-6 border-b border-gray-200">
          {tabs.map((tab, index) => (
            <NavLink
              key={index}
              to={tab.path}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium border-b-2 transition-all duration-300 ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content Section with Offset for Fixed Tabs */}
      <div className="mt-20 bg-white p-8 rounded-2xl shadow-lg">
        <Outlet />
      </div>
    </div>
  );
};

export default ReportTabs;
