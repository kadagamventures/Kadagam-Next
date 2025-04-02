import { Link, useLocation } from "react-router-dom";
import {
  FaChartPie,
  FaUsers,
  FaTasks,
  FaFileAlt,
  FaProjectDiagram,
  FaSyncAlt,
  FaCheckCircle,
  FaSignOutAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import kadagamLogo from "../assets/kadagamlogo.png";
import { useState } from "react";

const AdminSidebar = () => {
  const location = useLocation();
  const [glitters, setGlitters] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/admin/login";
  };

  const triggerGlitter = () => {
    const newGlitters = Array.from({ length: 20 }, () => ({
      id: Math.random(),
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${5 + Math.random() * 10}px`,
      color: ["gold", "white", "red", "blue"][Math.floor(Math.random() * 4)],
      duration: `${1 + Math.random()}s`,
      delay: `${Math.random()}s`,
    }));

    setGlitters(newGlitters);
    setTimeout(() => setGlitters([]), 1500);
  };

  return (
    <nav className="bg-sky-100 text-black-900 w-16 md:w-64 h-screen fixed top-0 left-0 p-4 md:p-6 flex flex-col shadow-lg">
      <div className="flex items-center mb-6 whitespace-nowrap">
        <img src={kadagamLogo} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 mr-0 md:mr-3" />
        <h3 className="hidden md:block font-extrabold text-red-600">
          Kadagam <span className="text-blue-600">Ventures</span>
        </h3>
      </div>

      <ul className="space-y-4 flex-grow">
        {[
          { path: "/admin/dashboard", label: "Dashboard", icon: FaChartPie },
          { path: "/admin/projects/list", label: "Projects", icon: FaProjectDiagram },
          { path: "/admin/staffs/list", label: "Staff", icon: FaUsers },
          { path: "/admin/tasks/list", label: "Tasks", icon: FaTasks },
          { path: "/admin/reports", label: "Reports", icon: FaFileAlt },
          { path: "/admin/daily-status", label: "Task Updates", icon: FaSyncAlt },
          { path: "/admin/leave-approval", label: "Leave Approval", icon: FaCheckCircle },
        ].map(({ path, label, icon: Icon }) => (
          <li key={path}>
            <Link
              to={path}
              className={`flex items-center px-3 py-3 rounded-lg transition-all duration-500 relative overflow-hidden ${
                location.pathname === path
                  ? "bg-gradient-to-r from-red-500 to-blue-500 text-white shadow-md"
                  : "hover:bg-gradient-to-r hover:from-red-500 hover:to-blue-500 hover:text-white"
              }`}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-blue-500 opacity-0 hover:opacity-100 transition-opacity duration-500"></span>
              <Icon className="text-lg relative transition-transform duration-300 group-hover:scale-110" />
              <span className="hidden md:inline ml-3 font-medium relative">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div
        className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg p-4 my-4 text-center shadow-md relative cursor-pointer overflow-hidden"
        onClick={triggerGlitter}
      >
        {glitters.map((glitter) => (
          <div
            key={glitter.id}
            className="absolute rounded-full opacity-80 animate-glitter"
            style={{
              left: glitter.left,
              top: glitter.top,
              width: glitter.size,
              height: glitter.size,
              backgroundColor: glitter.color,
              animationDuration: glitter.duration,
              animationDelay: glitter.delay,
            }}
          />
        ))}

        <div className="flex items-center justify-center mb-1">
          <FaCalendarAlt className="mr-2 text-lg" />
          <span className="text-lg font-bold">
            {new Date().toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="text-sm">
          {new Date().toLocaleDateString(undefined, { weekday: "long" })}
        </div>
      </div>

      <div className="mt-0">
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-3 w-full rounded-lg transition-all duration-500 bg-red-500 hover:bg-gradient-to-r hover:from-red-500 hover:to-blue-500 text-white shadow-md hover:shadow-lg"
        >
          <FaSignOutAlt className="text-lg transition-transform duration-300 hover:rotate-[-10deg]" />
          <span className="hidden md:inline ml-3 font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminSidebar;
