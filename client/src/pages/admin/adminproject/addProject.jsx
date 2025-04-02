import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects, addProject, updateProject } from "../../../redux/slices/projectSlice";

const AddProject = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: projects, error } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  const [newProject, setNewProject] = useState({
    name: "",
    relatedTo: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode) {
      const existing = projects.find((proj) => proj._id === id);
      if (existing) {
        setNewProject({
          name: existing.name,
          relatedTo: existing.relatedTo,
          description: existing.description,
        });
      }
    }
  }, [id, isEditMode, projects]);

  const validateForm = () => {
    if (!newProject.name.trim() || !newProject.relatedTo.trim() || !newProject.description.trim()) {
      setFormError("⚠️ All fields are required!");
      return false;
    }
    if (newProject.name.length > 100) {
      setFormError("⚠️ Project name cannot exceed 100 characters.");
      return false;
    }
    setFormError("");
    return true;
  };

  const handleInputChange = (e) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value });
  };

  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    const projectPayload = {
      ...newProject,
      startDate: getCurrentDate(),
      createdBy: user.id,
    };

    try {
      if (isEditMode) {
        await dispatch(updateProject({ id, ...projectPayload })).unwrap();
        setFormError("✅ Project updated successfully!");
      } else {
        await dispatch(addProject(projectPayload)).unwrap();
        setFormError("✅ Project added successfully!");
        setNewProject({ name: "", relatedTo: "", description: "" });
      }

      await dispatch(fetchProjects());
      navigate("/admin/projects/list");
    } catch (err) {
      setFormError(err.message || "Failed to save project.");
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
            {isEditMode ? "Update your project details" : "Create and manage your organization projects"}
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={() => navigate("/admin/projects/list")}
            className="w-full md:w-auto px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`w-full md:w-auto px-6 py-3 rounded-lg transition-all duration-300 ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
            disabled={loading}
          >
            {loading ? "Saving..." : isEditMode ? "Update Project" : "Save Project"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm">
        {formError && <p className={`mb-4 ${formError.includes("✅") ? "text-green-500" : "text-red-500"}`}>{formError}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

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
              maxLength={100}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Project Related to<span className="text-red-500 ml-1">*</span>
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

export default AddProject;
