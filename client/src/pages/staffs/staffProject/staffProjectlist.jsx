import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEdit, FaPlus } from "react-icons/fa";
import axiosInstance from "../../../utils/axiosInstance";

const StaffProjectList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Fetch projects with token auto-attached
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/projects");
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
      setError(err.response?.data?.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch projects on mount & when returning from edit page
  useEffect(() => {
    fetchProjects();
  }, [location]); // 🔥 Triggers fetch when navigating back to this page

  return (
    <div className="pl-0 md:pl-64 min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-8">
      {/* ✅ Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800"> Project List</h2>
          <p className="text-gray-500 mt-2">View and manage your assigned projects.</p>
        </div>
        <button
          onClick={() => navigate("/staff/projects/add")}
          className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white font-semibold rounded-xl shadow hover:scale-105 transform transition-all duration-300"
        >
          <FaPlus /> Add New Project
        </button>
      </div>

      {/* ✅ Content */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-lg font-medium">Loading projects...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-semibold">{error}</div>
        ) : projects.length > 0 ? (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-blue-600 to-red-600 text-white">
                <tr>
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Related To</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr
                    key={project._id}
                    className="hover:bg-blue-50 transition-all duration-200 rounded-xl"
                  >
                    <td className="p-4 font-medium text-gray-800">{project.name}</td>
                    <td className="p-4 text-gray-600">{project.relatedTo}</td>
                    <td className="p-4 text-gray-600 max-w-md truncate">{project.description}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => navigate(`/staff/projects/edit/${project._id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition-all"
                      >
                        <FaEdit /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 text-lg font-medium">
            No projects found. Start by adding a new project.
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffProjectList;
