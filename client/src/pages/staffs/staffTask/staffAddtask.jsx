import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks } from "../../../redux/slices/taskSlice";
import { fetchProjects } from "../../../redux/slices/projectSlice";
import { fetchStaffs } from "../../../redux/slices/staffSlice";
import axiosInstance from "../../../utils/axiosInstance";
import Select from "react-select";

const AddTask = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const dispatch = useDispatch();

  const { items: tasks } = useSelector((state) => state.tasks);
  const { items: projects, status: projectStatus } = useSelector((state) => state.projects);
  const { items: staffList, status: staffStatus } = useSelector((state) => state.staff);
  const { role, permissions } = useSelector((state) => state.auth.user || {});
  const canManageTasks = role === "admin" || (permissions && permissions.includes("manage_task"));

  const [task, setTask] = useState({
    title: "",
    projects: [],
    assignedTo: "", // ✅ Changed to string for single staff
    dueDate: "",
    priority: "Medium",
    description: "",
    attachment: null,
    attachmentName: "",
  });

  const projectOptions = projects.map((proj) => ({ value: proj._id, label: proj.name }));
  const staffOptions = staffList.map((staff) => ({
    value: staff._id,
    label: `${staff.name} (${staff.role})`,
  }));

  useEffect(() => {
    if (isEditMode) {
      if (tasks.length === 0) {
        dispatch(fetchTasks());
      } else {
        const existingTask = tasks.find((t) => t._id === id);
        if (existingTask) {
          setTask({
            title: existingTask.title,
            projects: existingTask.projects.map((p) => p._id),
            assignedTo: existingTask.assignedTo?._id || "", // ✅ Single staff
            dueDate: existingTask.dueDate ? existingTask.dueDate.split("T")[0] : "",
            priority: existingTask.priority,
            description: existingTask.description,
            attachment: null,
            attachmentName: "",
          });
        } else {
          alert("Task not found.");
          navigate("/staff/tasks/list");
        }
      }
    }
  }, [dispatch, id, isEditMode, tasks, navigate]);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (staffList.length === 0 && staffStatus === "idle") {
      dispatch(fetchStaffs());
    }
  }, [dispatch, staffList.length, staffStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectSelect = (selectedOptions) => {
    const selectedIds = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setTask((prev) => ({ ...prev, projects: selectedIds }));
  };

  // ✅ Single staff assignment
  const handleStaffSelect = (selectedOption) => {
    setTask((prev) => ({ ...prev, assignedTo: selectedOption ? selectedOption.value : "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTask((prev) => ({
        ...prev,
        attachment: file,
        attachmentName: file.name,
      }));
    }
  };

  const handleRemoveAttachment = () => {
    setTask((prev) => ({
      ...prev,
      attachment: null,
      attachmentName: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageTasks) return alert("❌ You do not have permission to add tasks.");

    if (!task.title || task.projects.length === 0 || !task.assignedTo || !task.dueDate || !task.priority || !task.description) {
      return alert("❌ Please fill all required fields.");
    }

    const formData = new FormData();
    formData.append("title", task.title);
    formData.append("dueDate", task.dueDate);
    formData.append("priority", task.priority);
    formData.append("description", task.description);
    task.projects.forEach((projectId) => formData.append("projects[]", projectId));
    formData.append("assignedTo", task.assignedTo); // ✅ Single staff only
    if (task.attachment) formData.append("attachments", task.attachment);

    try {
      const response = isEditMode
        ? await axiosInstance.put(`/tasks/${id}`, formData)
        : await axiosInstance.post("/tasks", formData);

      if (response.status === 200 || response.status === 201) {
        alert(`✅ Task ${isEditMode ? "updated" : "added"} successfully!`);
        navigate("/staff/tasks/list");
      } else {
        alert("❌ Failed to save task.");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert(error.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <div className="pl-64 min-h-screen bg-gray-50 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 pb-2">
            {isEditMode ? "Edit Task" : "Add New Task"}
          </h2>
          <p className="text-gray-500 mt-1 pb-5">
            {isEditMode ? "Update the task details below" : "You can manage your organization's tasks"}
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={() => navigate("/staff/tasks/list")}
            className="w-full md:w-auto px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
          >
            {isEditMode ? "Update Task" : "Save Task"}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={task.title} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Choose Projects <span className="text-red-500">*</span></label>
              <Select isMulti options={projectOptions} value={projectOptions.filter((opt) => task.projects.includes(opt.value))} onChange={handleProjectSelect} placeholder="Select project(s)..." />
            </div>

            {/* ✅ Single Staff Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Staff <span className="text-red-500">*</span></label>
              <Select
                isMulti={false}
                options={staffOptions}
                value={staffOptions.find((opt) => opt.value === task.assignedTo) || null}
                onChange={handleStaffSelect}
                placeholder="Select one staff..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
              <input type="date" name="dueDate" value={task.dueDate} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority <span className="text-red-500">*</span></label>
              <select name="priority" value={task.priority} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
              {task.attachment ? (
                <div className="flex items-center space-x-2">
                  <span>{task.attachmentName}</span>
                  <button type="button" onClick={handleRemoveAttachment} className="px-2 py-1 bg-red-500 text-white rounded-lg">Remove</button>
                </div>
              ) : (
                <input type="file" name="attachment" onChange={handleFileChange} className="w-full px-4 py-2.5 border rounded-lg" />
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Description <span className="text-red-500">*</span></label>
              <textarea name="description" value={task.description} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg min-h-[120px]" placeholder="Enter task details" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTask;
