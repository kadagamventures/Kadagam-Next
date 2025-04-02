import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaPlus } from "react-icons/fa";
import { fetchTasks } from "../../../redux/slices/taskSlice";

const TaskList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: tasks = [], status, error } = useSelector((state) => state.tasks);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchTasks());
    }
  }, [dispatch, status]);

  const handleAddTask = () => {
    navigate("/staff/tasks/add");
  };

  const filteredTasks = tasks.filter((task) =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.projects?.some((proj) => proj.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (Array.isArray(task.assignedTo) 
      ? task.assignedTo.some((staff) => staff.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      : task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    task.dueDate?.includes(searchTerm)
  );

  return (
    <div className="pl-0 md:pl-64 min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 p-8">
      {/* ✅ Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-gradient-to-r from-blue-600 to-red-600 p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-white">Task Management</h2>
        <button
          onClick={handleAddTask}
          className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all"
        >
          <FaPlus className="inline mr-2" /> Add New Task
        </button>
      </div>

      {/* ✅ Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder=" Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ✅ Task Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {status === "loading" ? (
          <div className="p-8 text-center text-gray-500">⏳ Loading tasks...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">❌ {error}</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tasks found!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 shadow-sm">
              <thead className="bg-gradient-to-r from-blue-500 to-red-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Task Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Project(s)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Assigned To</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Due Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Priority</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gradient-to-r from-gray-50 to-gray-100 transition">
                    <td className="px-6 py-4 text-sm text-gray-800">{task.title}</td>

                    {/* ✅ Project Names */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.projects?.map((proj) => (
                        <span key={proj._id} className="inline-block mr-1 bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                          {proj.name}
                        </span>
                      ))}
                    </td>

                    {/* ✅ Assigned Staff */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                        task.assignedTo.map((staff) => (
                          <span key={staff._id} className="inline-block mr-1 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                            {staff.name}
                          </span>
                        ))
                      ) : (
                        task.assignedTo?.name && (
                          <span className="inline-block bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                            {task.assignedTo.name}
                          </span>
                        )
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}
                    </td>

                    {/* ✅ Priority with colors */}
                    <td className={`px-6 py-4 text-sm font-bold ${
                      task.priority === "High" ? "text-red-500" : 
                      task.priority === "Medium" ? "text-yellow-500" : "text-green-500"
                    }`}>
                      {task.priority}
                    </td>

                    {/* ✅ Edit Button */}
                    <td className="px-6 py-4 text-right text-sm">
                      {/* Assuming you want to restrict edit based on creator logic */}
                      <button
                        onClick={() => navigate(`/staff/tasks/edit/${task._id}`)}
                        className="px-3 py-2 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 transition-all"
                      >
                        <FaEdit className="inline mr-1" /> Edit
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
