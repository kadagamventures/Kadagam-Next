import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, deleteTask } from "../../../redux/slices/taskSlice";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";

const TaskList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // ✅ Get tasks from Redux
  const { items: tasks = [], status, error } = useSelector((state) => state.tasks);

  // ✅ Fetch tasks if idle
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchTasks());
    }
  }, [dispatch, status]);

  // ✅ Navigate actions
  const handleAddTask = useCallback(() => navigate("/admin/tasks/add"), [navigate]);
  const handleEdit = useCallback((id) => navigate(`/admin/tasks/edit/${id}`), [navigate]);

  // ✅ Handle Delete Task
  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm("Are you sure you want to delete this task?")) {
        setDeletingId(id);
        try {
          await dispatch(deleteTask(id)).unwrap();
          alert("✅ Task deleted successfully!");
        } catch (err) {
          alert("❌ Failed to delete task. Please try again.");
        } finally {
          setDeletingId(null);
        }
      }
    },
    [dispatch]
  );

  // ✅ Filter tasks based on search input
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) =>
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.projects?.some((proj) => proj.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  return (
    <div className="pl-0 md:pl-64 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* ✅ Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-white">Task Dashboard</h2>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              className="p-3 pl-10 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-gray-800 text-white placeholder-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search tasks"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-500" />
          </div>
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg shadow-lg hover:from-green-500 hover:to-blue-600 transition-all"
            aria-label="Add new task"
          >
            <FaPlus className="inline mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4 text-center">⚠️ {error}</p>}

      <div className="bg-white p-6 rounded-xl shadow-xl">
        {status === "loading" ? (
          <p className="text-gray-500 text-center animate-pulse">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-gray-500 text-center">No tasks found. Start by adding one!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg shadow-lg">
              <thead className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                <tr>
                  <th className="border-b border-gray-200 p-4 text-left">Task Name</th>
                  <th className="border-b border-gray-200 p-4 text-left">Project(s)</th>
                  <th className="border-b border-gray-200 p-4 text-left">Assigned Staff</th>
                  <th className="border-b border-gray-200 p-4 text-left">Due Date</th>
                  <th className="border-b border-gray-200 p-4 text-left">Priority</th>
                  <th className="border-b border-gray-200 p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50 transition">
                    <td className="border-b border-gray-200 p-4 font-semibold text-gray-800">{task.title}</td>
                    <td className="border-b border-gray-200 p-4">
                      {task.projects?.map((proj) => (
                        <span
                          key={proj._id}
                          className="inline-block mr-1 bg-gradient-to-r from-green-100 to-green-200 px-2 py-1 text-xs font-medium rounded shadow-sm"
                        >
                          {proj.name}
                        </span>
                      )) || "N/A"}
                    </td>
                    <td className="border-b border-gray-200 p-4">
                      {task.assignedTo?.name ? (
                        <span className="inline-block bg-gradient-to-r from-blue-100 to-blue-200 px-2 py-1 text-xs font-medium rounded shadow-sm">
                          {task.assignedTo.name}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="border-b border-gray-200 p-4">
                      <span className="bg-gray-100 px-2 py-1 text-xs font-medium rounded shadow-sm">
                        {task.dueDate?.split("T")[0] || "N/A"}
                      </span>
                    </td>
                    <td className="border-b border-gray-200 p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                          task.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="border-b border-gray-200 p-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(task._id)}
                        className="px-3 py-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg shadow-lg hover:from-blue-500 hover:to-blue-600 transition"
                        aria-label={`Edit task ${task.title}`}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(task._id)}
                        className={`px-3 py-1 rounded-lg text-white shadow-lg ${
                          deletingId === task._id
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        } transition`}
                        aria-label={`Delete task ${task.title}`}
                        disabled={deletingId === task._id}
                      >
                        {deletingId === task._id ? "Deleting..." : <FaTrash />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
