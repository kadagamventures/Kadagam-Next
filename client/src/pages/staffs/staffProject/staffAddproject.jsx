import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "../../../utils/axiosInstance";

const StaffAddProject = () => {
  const { id } = useParams(); // Get project ID if edit mode
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const [newProject, setNewProject] = useState({
    name: "",
    relatedTo: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // ✅ Check permission for manage_project
  const hasPermission = user?.role === "admin" || user?.permissions?.includes("manage_project");

  useEffect(() => {
    if (!hasPermission) {
      setFormError("❌ You don't have permission to manage projects.");
      setTimeout(() => navigate("/staff/dashboard"), 2000);
      return;
    }

    if (isEditMode) {
      fetchProjectDetails(id); // ✅ Ensures data fetch when editing
    }
  }, [id]); // ✅ Dependency ensures fetching when ID changes

  // ✅ Fetch project in edit mode
  const fetchProjectDetails = async (projectId) => {
    try {
      const { data } = await axiosInstance.get(`/projects/${projectId}`);
      setNewProject({
        name: data.project.name,
        relatedTo: data.project.relatedTo,
        description: data.project.description,
      });
    } catch (err) {
      console.error("❌ Error fetching project:", err);
      setFormError(err.response?.data?.message || "Failed to load project details.");
    }
  };

  const handleInputChange = (e) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value });
  };

  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const validateForm = () => {
    if (!newProject.name.trim() || !newProject.relatedTo.trim() || !newProject.description.trim()) {
      setFormError("⚠️ All fields are required!");
      return false;
    }
    if (newProject.name.length > 50) {
      setFormError("⚠️ Project name cannot exceed 50 characters.");
      return false;
    }
    setFormError("");
    return true;
  };

  // ✅ Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const projectData = {
      ...newProject,
      startDate: getCurrentDate(), // ✅ Auto-set current date
      createdBy: user.id, // ✅ Required backend field
    };

    try {
      if (isEditMode) {
        await axiosInstance.put(`/projects/${id}`, projectData);
        alert("✅ Project updated successfully!");
      } else {
        await axiosInstance.post("/projects", projectData);
        alert("✅ Project added successfully!");
        setNewProject({ name: "", relatedTo: "", description: "" });
      }

      // ✅ Reload project list before navigating
      navigate("/staff/projects/list", { state: { refresh: true } });
    } catch (err) {
      console.error("❌ Error saving project:", err);
      setFormError(err.response?.data?.message || "Failed to save project.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="pl-64 p-8 min-h-screen">Saving...</div>;

  return (
    <div className="pl-0 md:pl-64 min-h-screen bg-gradient-to-br from-red-500 to-blue-500 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            {isEditMode ? "Edit Project" : "Add New Project"}
          </h2>
          <p className="text-gray-500 mt-1">
            {isEditMode
              ? "Update your project details"
              : "Create and manage your organization projects"}
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={() => navigate("/staff/projects/list")}
            className="w-full md:w-auto px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="projectForm"
            className={`w-full md:w-auto px-6 py-3 rounded-lg transition-all duration-300 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
            disabled={loading}
          >
            {loading ? "Saving..." : isEditMode ? "Update Project" : "Save Project"}
          </button>
        </div>
      </div>

      <form id="projectForm" onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm">
        {formError && <p className="text-red-500 bg-red-100 p-3 rounded-md">{formError}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Project Name<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={newProject.name}
              onChange={handleInputChange}
              placeholder="Enter project name"
              maxLength={50}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Project Related To<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="relatedTo"
              value={newProject.relatedTo}
              onChange={handleInputChange}
              placeholder="E.g., Marketing, Development, Design"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Project Description<span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              name="description"
              value={newProject.description}
              onChange={handleInputChange}
              placeholder="Describe the project scope, goals, and key details..."
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400 resize-y min-h-[120px]"
            ></textarea>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StaffAddProject;
