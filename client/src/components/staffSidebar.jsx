import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaChartPie,
  FaTasks,
  FaProjectDiagram,
  FaUsers,
  FaFileAlt,
  FaSignOutAlt,
  FaUserCircle,
  FaCalendarAlt,
  FaBook,
} from "react-icons/fa";
import { useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../utils/axiosInstance";
import logo from "../assets/kadagamlogo.png";
import {
  fetchPermissions,
  fetchActiveSession,
  setProfileImage,
  setIsWorking,
  incrementTimer,
  setTimer,
  setIntervalId,
  clearIntervalId,
} from "../redux/slices/staffSidebarslice";

const StaffSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { permissions, isWorking, timer, profileImage, intervalId } =
    useSelector((state) => state.staffSidebar) || {
      permissions: [],
      isWorking: false,
      timer: 0,
      profileImage: "",
      intervalId: null,
    };

  useEffect(() => {
    dispatch(fetchPermissions());
    dispatch(fetchActiveSession());
  }, [dispatch]);

  const startTimer = useCallback(() => {
    if (intervalId) return;
    const id = setInterval(() => {
      dispatch(incrementTimer());
    }, 1000);
    dispatch(setIntervalId(id));
  }, [dispatch, intervalId]);

  const stopTimer = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      dispatch(clearIntervalId());
    }
  }, [dispatch, intervalId]);

  useEffect(() => {
    const storedTimer = localStorage.getItem("workTimer");
    const storedWorking = localStorage.getItem("isWorking");

    if (storedTimer) dispatch(setTimer(parseInt(storedTimer, 10)));
    if (storedWorking === "true") {
      dispatch(setIsWorking(true));
      startTimer();
    }
  }, [dispatch, startTimer]);

  useEffect(() => {
    localStorage.setItem("workTimer", timer);
  }, [timer]);

  useEffect(() => {
    const storedProfileImage = localStorage.getItem("profileImage");
    if (storedProfileImage) dispatch(setProfileImage(storedProfileImage));
  }, [dispatch]);

  const allowedLinks = useMemo(() => {
    const allLinks = [
      {
        permission: "manage_task",
        path: "/staff/tasks/list",
        icon: <FaTasks />,
        label: "Tasks",
      },
      {
        permission: "manage_project",
        path: "/staff/projects/list",
        icon: <FaProjectDiagram />,
        label: "Projects",
      },
      {
        permission: "manage_staff",
        path: "/staff/staffs/list",
        icon: <FaUsers />,
        label: "Staffs",
      },
    ];

    return allLinks.filter((link) => permissions.includes(link.permission));
  }, [permissions]);

  const handleAttendanceToggle = async () => {
    if (isWorking) {
      try {
        await axiosInstance.post("/attendance/check-out");
        stopTimer();
        localStorage.setItem("isWorking", "false");
        dispatch(setIsWorking(false));
        dispatch(setTimer(0));
      } catch (error) {
        console.error("Error during check-out:", error.response?.data || error.message);
      }
    } else {
      try {
        await axiosInstance.post("/attendance/check-in");
        startTimer();
        localStorage.setItem("isWorking", "true");
        dispatch(setIsWorking(true));
      } catch (error) {
        if (error.response?.status === 400) {
          const errorMsg = error.response.data.message;
          alert(errorMsg);
          if (errorMsg.toLowerCase().includes("already checked in")) {
            startTimer();
            localStorage.setItem("isWorking", "true");
            dispatch(setIsWorking(true));
          }
        } else {
          console.error("Error during check-in:", error.response?.data || error.message);
        }
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/staff/login");
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const currentDay = currentDate.toLocaleDateString(undefined, { weekday: "long" });

  return (
    <nav className="bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] text-black w-16 md:w-64 h-screen fixed top-0 left-0 p-4 flex flex-col shadow-xl justify-between">
      <div>
        <div className="flex items-center space-x-0 md:space-x-2 mb-4">
          <img src={logo} alt="Logo" className="w-10 h-10 md:w-12 md:h-12" />
          <h3 className="hidden md:block font-extrabold text-red-600">
            Kadagam <span className="text-blue-600">Ventures</span>
          </h3>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 mb-4 flex items-center cursor-pointer hover:bg-gray-100" onClick={() => navigate("/staff/profile")}>
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover mr-3" />
          ) : (
            <FaUserCircle className="text-2xl text-gray-500 mr-3" />
          )}
          <span className="hidden md:inline font-bold">My Profile</span>
        </div>

        <ul className="space-y-3">
          <li>
            <Link to="/staff/dashboard" className={`flex items-center px-3 py-2 rounded-lg transition-all ${location.pathname === "/staff/dashboard" ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}>
              <FaChartPie className="mr-3" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/staff/reports" className={`flex items-center px-3 py-2 rounded-lg transition-all ${location.pathname === "/staff/reports" ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}>
              <FaFileAlt className="mr-3" />
              <span className="hidden md:inline">Reports</span>
            </Link>
          </li>
          {allowedLinks.map((link) => (
            <li key={link.path}>
              <Link to={link.path} className={`flex items-center px-3 py-2 rounded-lg transition-all ${location.pathname === link.path ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}>
                {link.icon}
                <span className="hidden md:inline ml-3">{link.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link to="/staff/office-rules" className={`flex items-center px-3 py-2 rounded-lg transition-all ${location.pathname === "/staff/office-rules" ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}>
              <FaBook className="mr-3" />
              <span className="hidden md:inline">Office Rules</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-3 my-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <FaCalendarAlt className="text-blue-500 mr-2" />
          <span className="text-lg font-bold">{formattedDate}</span>
        </div>
        <div className="text-sm text-gray-600 mb-2">{currentDay}</div>
        <div className="text-lg font-bold mb-2">{formatTime(timer)}</div>
        <button onClick={handleAttendanceToggle} className={`w-full py-2 rounded-lg font-bold transition ${isWorking ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>
          {isWorking ? "Stop Work" : "Start Work"}
        </button>
      </div>

      <button onClick={handleLogout} className="flex items-center justify-center w-full py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg mt-4 transition-all">
        <FaSignOutAlt className="mr-2" />
        <span className="hidden md:inline">Logout</span>
      </button>
    </nav>
  );
};

export default StaffSidebar;
