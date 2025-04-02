import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/projects");
      setProjects(response.data.projects || []);
    } catch {
      setError("Unable to load projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleEdit = (id) => {
    navigate(`/admin/projects/edit/${id}`);
  };

  const handleDeleteConfirm = async (id) => {
    setDeletingId(id);
    try {
      await axiosInstance.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((proj) => proj._id !== id));
    } catch {
      setError("Failed to delete project. Please try again.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.relatedTo.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  return (
    <div className="pl-0 md:pl-64 min-h-screen bg-gradient-to-br from-blue-50 to-red-100 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">Project List</h2>
          <p className="text-gray-500 mt-2">View and manage your organization projects.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <input
            type="text"
            placeholder="Search projects..."
            className="p-3 border rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={() => navigate("/admin/projects/add")}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-blue-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow hover:scale-105 transform transition-all duration-300"
          >
            + Add New Project
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-700 mb-4 text-lg font-medium">Loading projects...</p>}
      {error && <p className="text-red-500 mb-4 font-semibold">⚠️ {error}</p>}

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        {filteredProjects.length === 0 ? (
          <p className="text-gray-500 text-center text-lg">No projects found. Start by adding one!</p>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-red-600 to-blue-600 text-white">
                <tr>
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Related To</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project._id} className="hover:bg-blue-50 transition-all duration-200">
                    <td className="p-4 font-medium text-gray-800">{project.name}</td>
                    <td className="p-4 text-gray-600">{project.relatedTo}</td>
                    <td className="p-4 text-gray-600 max-w-md truncate">{project.description}</td>
                    <td className="p-4 text-center flex gap-3 justify-center">
                      <button
                        onClick={() => handleEdit(project._id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(project._id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Are you sure?</h3>
            <p className="text-gray-600 mb-6">Do you really want to delete this project? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(confirmDeleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                disabled={deletingId === confirmDeleteId}
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
