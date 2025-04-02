import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance.js";
import StaffSidebar from "../../components/staffSidebar.jsx";
import { FaEdit, FaBell } from "react-icons/fa";
import PropTypes from "prop-types";

// ✅ Priority Gradient Colors
const priorityGradients = {
  High: "bg-gradient-to-r from-red-400 via-red-500 to-red-600 border-red-600",
  Medium: "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 border-yellow-500",
  Low: "bg-gradient-to-r from-green-300 via-green-400 to-green-500 border-green-500",
};

// ✅ Status Background Colors
const statusColors = {
  todo: "bg-white border border-blue-200",
  ongoing: "bg-white border border-orange-200",
  completed: "bg-white border border-pink-200",
  overdue: "bg-white border border-red-200",
};

// ✅ Notification Bell Component
const NotificationBell = ({ notifications, onToggle, showNotifications }) => (
  <div className="relative">
    <FaBell
      onClick={onToggle}
      className="text-3xl cursor-pointer text-gray-700 hover:text-gray-900 transition-all hover:scale-110"
    />
    {notifications.length > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg">
        {notifications.length}
      </span>
    )}
    {showNotifications && (
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl z-10 border border-gray-200 transition-all transform hover:scale-105">
        <ul>
          {notifications.map((n) => (
            <li key={n._id} className="p-3 border-b last:border-b-0 text-sm">
              <span>{n.message}</span>
              <br />
              <span className="text-xs text-gray-500">
                {new Date(n.time).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

NotificationBell.propTypes = {
  notifications: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
  showNotifications: PropTypes.bool.isRequired,
};

const StaffDashboard = () => {
  const dispatch = useDispatch();
  const [kanbanTasks, setKanbanTasks] = useState({
    todo: [],
    ongoing: [],
    completed: [],
    overdue: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dailyUpdates, setDailyUpdates] = useState({});
  const user = useSelector((state) => state.staffAuth.user);

  // ✅ Fetch Kanban Tasks
  const fetchKanbanTasks = async () => {
    try {
      const response = await axiosInstance.get("/tasks/kanban");
      setKanbanTasks(response.data);
    } catch (error) {
      console.error("❌ Error fetching Kanban:", error.response?.data || error.message);
    }
  };

  // ✅ Initial load of Kanban tasks
  useEffect(() => {
    fetchKanbanTasks();
  }, []);

  // ✅ Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axiosInstance.get("/notifications");
        setNotifications(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching notifications:", err.response?.data || err.message);
      }
    };
    fetchNotifications();
  }, []);

  // ✅ Drag Handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) {
      console.error("❌ No task ID during drop");
      return;
    }

    const statusMapping = {
      todo: "To Do",
      ongoing: "Ongoing",
      completed: "Completed",
      overdue: "Overdue",
    };

    try {
      const res = await axiosInstance.put(`/tasks/staff/${taskId}`, {
        status: statusMapping[newStatus],
      });
      if (res.status === 200) {
        fetchKanbanTasks();
      }
    } catch (err) {
      console.error("❌ Status update failed:", err.response?.data || err.message);
    }
  };

  // ✅ Submit Daily Update
  const submitDailyUpdate = async (taskId) => {
    const updateText = dailyUpdates[taskId]?.trim();
    if (!updateText) return alert("Please enter your update.");

    try {
      const res = await axiosInstance.post(`/tasks/${taskId}/daily-comment`, {
        comment: updateText,
      });
      if (res.status === 200) {
        setDailyUpdates((prev) => ({ ...prev, [taskId]: "" }));
        alert("✅ Update successfully added!");
        fetchKanbanTasks();
      }
    } catch (err) {
      console.error("❌ Error submitting update:", err.response?.data || err.message);
    }
  };

  // ✅ Render Task Card
  const renderTaskCard = (task, status) => (
    <div
      key={task._id}
      draggable
      onDragStart={(e) => handleDragStart(e, task._id)}
      className={`p-5 mb-4 rounded-3xl border-l-8 bg-white shadow-lg hover:shadow-xl transition transform hover:scale-[1.04] ${
        priorityGradients[task.priority]
      }`}
    >
      <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
      <p className="text-sm text-gray-700">Priority: {task.priority}</p>
      <p className="text-sm text-gray-700">
        Due: {new Date(task.dueDate).toLocaleDateString()}
      </p>
      {task.projects?.length > 0 && (
        <p className="text-sm text-gray-700">
          Project: {task.projects.map((p) => p.name).join(", ")}
        </p>
      )}

      {status === "ongoing" && (
        <div className="mt-3">
          <input
            type="text"
            placeholder="Enter your daily progress"
            value={dailyUpdates[task._id] || ""}
            onChange={(e) =>
              setDailyUpdates((prev) => ({
                ...prev,
                [task._id]: e.target.value,
              }))
            }
            className="border p-2 w-full rounded-lg"
          />
          <button
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white px-4 py-2 mt-3 rounded-full shadow-md hover:shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 w-full"
            onClick={() => submitDailyUpdate(task._id)}
          >
            <FaEdit className="inline mr-2" /> <span>Submit Progress</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen pl-64 flex-col bg-gray-100">
      <StaffSidebar />
      <div className="flex-grow p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Task Management Board</h2>
          <NotificationBell
            notifications={notifications}
            onToggle={() => setShowNotifications((prev) => !prev)}
            showNotifications={showNotifications}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {["todo", "ongoing", "completed", "overdue"].map((status) => (
            <div
              key={status}
              onDrop={(e) => handleDrop(e, status)}
              onDragOver={(e) => e.preventDefault()}
              className={`p-6 rounded-3xl shadow-xl ${statusColors[status]}`}
            >
              <h2 className="text-xl font-bold mb-4 capitalize">{status}</h2>
              {kanbanTasks[status]?.length ? kanbanTasks[status].map((task) => renderTaskCard(task, status)) : <p>No tasks</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
