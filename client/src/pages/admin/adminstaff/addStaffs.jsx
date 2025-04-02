import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { debounce } from "lodash";
import { addStaff, updateStaff, fetchStaffById } from "../../../redux/slices/staffSlice";
import { fetchProjects } from "../../../redux/slices/projectSlice";
import axiosInstance from "../../../utils/axiosInstance";

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/admin/staff";

const permissionOptions = [
  "All Permission",
  "manage_task",
  "manage_staff",
  "manage_project",
  "No Permission",
];

const StaffForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: staffList, selectedStaff, rawPassword } = useSelector((state) => state.staff);
  const { items: projectsList } = useSelector((state) => state.projects);

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    salary: "",
    role: "",
    assignedTeam: "",
    assignedProjects: [],
    permissions: [],
    profilePic: null,
    resume: null,
    staffId: "",
  });

  const [profilePicKey, setProfilePicKey] = useState(Date.now());
  const [resumeKey, setResumeKey] = useState(Date.now());
  const [staffIdValid, setStaffIdValid] = useState(null);
  const [suggestedStaffId, setSuggestedStaffId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!projectsList.length) {
      dispatch(fetchProjects());
    }
  }, [dispatch, projectsList.length]);

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchStaffById(id));
    }
  }, [isEditMode, id, dispatch]);

  useEffect(() => {
    if (isEditMode && selectedStaff && selectedStaff._id === id) {
      setNewStaff({
        _id: selectedStaff._id,
        name: selectedStaff.name || "",
        email: selectedStaff.email || "",
        phone: selectedStaff.phone || "",
        salary: selectedStaff.salary || "",
        role: selectedStaff.role || "",
        assignedTeam: selectedStaff.assignedTeam || "",
        assignedProjects: selectedStaff.assignedProjects || [],
        permissions: selectedStaff.permissions || [],
        profilePic: selectedStaff.profilePic || null,
        resume: selectedStaff.resume || null,
        staffId: selectedStaff.staffId || "",
      });
      setStaffIdValid(true);
    }
  }, [isEditMode, id, selectedStaff]);

  const validateStaffId = useCallback(
    debounce(async (staffId) => {
      if (!staffId.trim()) {
        setStaffIdValid(null);
        setSuggestedStaffId("");
        return;
      }
      try {
        const res = await axiosInstance.get(`${API_BASE_URL}/check-id?staffId=${staffId}`);
        setStaffIdValid(res.data.valid);
        setSuggestedStaffId("");
      } catch (error) {
        setStaffIdValid(false);
        setSuggestedStaffId(error.response?.data?.suggestedId || "");
      }
    }, 500),
    []
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (file) {
        file.preview = URL.createObjectURL(file);
      }
      setNewStaff((prev) => ({ ...prev, [name]: file }));
      return;
    }
    if (name === "permissions") {
      setNewStaff((prev) => {
        let updatedPermissions = checked
          ? [...prev.permissions, value]
          : prev.permissions.filter((perm) => perm !== value);
        if (value === "All Permission" && checked) {
          updatedPermissions = ["manage_staff", "manage_project", "manage_task"];
        }
        if (value === "No Permission" && checked) {
          updatedPermissions = ["No Permission"];
        } else {
          updatedPermissions = updatedPermissions.filter((perm) => perm !== "No Permission");
        }
        return { ...prev, permissions: updatedPermissions };
      });
      return;
    }
    if (name === "staffId") {
      setNewStaff((prev) => ({ ...prev, staffId: value }));
      validateStaffId(value);
      return;
    }
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectChange = (selectedOptions) => {
    const selectedProjectIds = selectedOptions.map((option) => option.value);
    setNewStaff((prev) => ({ ...prev, assignedProjects: selectedProjectIds }));
  };

  const handleDeleteFile = (fieldName) => {
    setNewStaff((prev) => ({ ...prev, [fieldName]: null }));
    if (fieldName === "profilePic") {
      setProfilePicKey(Date.now());
    } else if (fieldName === "resume") {
      setResumeKey(Date.now());
    }
  };

  const handleAddOrUpdateStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.email.trim()) return;
    if (!newStaff.staffId.trim() || staffIdValid === false) return;

    const formData = new FormData();
    formData.append("name", newStaff.name);
    formData.append("email", newStaff.email);
    formData.append("phone", newStaff.phone);
    formData.append("salary", newStaff.salary);
    formData.append("role", newStaff.role);
    formData.append("assignedTeam", newStaff.assignedTeam);
    formData.append("staffId", newStaff.staffId);
    formData.append("assignedProjects", JSON.stringify(newStaff.assignedProjects));
    formData.append("permissions", JSON.stringify(newStaff.permissions));
    if (newStaff.profilePic && newStaff.profilePic instanceof File) {
      formData.append("profilePic", newStaff.profilePic);
    }
    if (newStaff.resume && newStaff.resume instanceof File) {
      formData.append("resume", newStaff.resume);
    }

    try {
      const resultAction = await dispatch(
        isEditMode
          ? updateStaff({ id: newStaff._id || id, formData })
          : addStaff(formData)
      );

      if (resultAction.meta.requestStatus === "fulfilled") {
        setSuccessMessage(
          isEditMode
            ? "Staff updated successfully!"
            : "Staff created successfully! The temporary password has been sent to the staff's email."
        );
        navigate("/admin/staffs/list");
      }
    } catch (error) {
      // Optionally, handle error state here.
    }
  };

  return (
    <div className="p-4 pl-64 bg-gradient-to-br from-red-500 to-blue-500 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 pb-2">
            {isEditMode ? "Update Staff Member" : "Add New Staff Member"}
          </h2>
          <p className="text-gray-500 mt-1">Manage your team's members</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/admin/staffs/list")}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleAddOrUpdateStaff}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
          >
            {isEditMode ? "Update Staff" : "Add Staff"}
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Personal Information
              </h3>
              <input
                type="text"
                name="name"
                value={newStaff.name}
                onChange={handleInputChange}
                placeholder="Name"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-blue-500"
              />
              <input
                type="email"
                name="email"
                value={newStaff.email}
                onChange={handleInputChange}
                placeholder="Email"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-blue-500"
              />
              <input
                type="text"
                name="phone"
                value={newStaff.phone}
                onChange={handleInputChange}
                placeholder="Phone Number"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-blue-500"
              />
              <input
                type="number"
                name="salary"
                value={newStaff.salary}
                onChange={handleInputChange}
                placeholder="Salary"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-blue-500"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Role & Team
              </h3>
              <input
                type="text"
                name="role"
                value={newStaff.role}
                onChange={handleInputChange}
                placeholder="Enter Role (e.g., Developer)"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-blue-500"
              />
              <input
                type="text"
                name="assignedTeam"
                value={newStaff.assignedTeam}
                onChange={handleInputChange}
                placeholder="Enter Team Name"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-blue-500"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Assigned Projects
                </h3>
                <Select
                  isMulti
                  name="assignedProjects"
                  options={projectsList.map((project) => ({
                    value: project._id,
                    label: project.name,
                  }))}
                  value={projectsList
                    .filter((project) =>
                      newStaff.assignedProjects.includes(project._id)
                    )
                    .map((project) => ({
                      value: project._id,
                      label: project.name,
                    }))}
                  onChange={handleProjectChange}
                  className="w-full"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "gray",
                      borderRadius: "8px",
                      padding: "4px",
                      boxShadow: "none",
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#3B82F6",
                      color: "white",
                      borderRadius: "4px",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "white",
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: "white",
                      ":hover": { backgroundColor: "#2563EB" },
                    }),
                  }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Permissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {permissionOptions.map((perm) => (
                  <label
                    key={perm}
                    className={`flex items-center p-3 border rounded-lg ${
                      newStaff.permissions.includes(perm)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="permissions"
                      value={perm}
                      checked={newStaff.permissions.includes(perm)}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm capitalize font-medium text-gray-700">
                      {perm === "manage_task"
                        ? "Task Creation"
                        : perm === "manage_staff"
                        ? "Add Staff"
                        : perm === "manage_project"
                        ? "Project Creation"
                        : perm === "All Permission"
                        ? "All Permission"
                        : perm === "No Permission"
                        ? "No Permission"
                        : perm}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Documents
              </h3>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1">
                  Profile Picture (Optional)
                </label>
                <input
                  key={profilePicKey}
                  type="file"
                  name="profilePic"
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-blue-500"
                />
                {newStaff.profilePic && (
                  <div className="flex items-center mt-2 space-x-4">
                    <button
                      onClick={() =>
                        window.open(newStaff.profilePic.preview || newStaff.profilePic, "_blank")
                      }
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteFile("profilePic")}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Resume (Optional)
                </label>
                <input
                  key={resumeKey}
                  type="file"
                  name="resume"
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-blue-500"
                />
                {newStaff.resume && (
                  <div className="flex items-center mt-2 space-x-4">
                    <button
                      onClick={() =>
                        window.open(newStaff.resume.preview || newStaff.resume, "_blank")
                      }
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteFile("resume")}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Staff ID Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Staff ID
            </h3>
            <input
              type="text"
              name="staffId"
              value={newStaff.staffId}
              onChange={handleInputChange}
              placeholder="Enter Staff ID (e.g., 8001)"
              className={`w-full px-4 py-2.5 border rounded-lg ${
                staffIdValid === false ? "border-red-500" : "border-gray-300"
              } focus:ring-blue-500`}
            />
            {staffIdValid === false && suggestedStaffId && (
              <p className="text-red-500 text-sm">
                Staff ID is taken. Try:{" "}
                <button
                  type="button"
                  onClick={() => {
                    setNewStaff((prev) => ({ ...prev, staffId: suggestedStaffId }));
                    setStaffIdValid(true);
                  }}
                  className="ml-2 text-blue-600 underline"
                >
                  {suggestedStaffId}
                </button>
              </p>
            )}
          </div>
          <div className="flex flex-col justify-end">
            <div className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg transition-all duration-300">
              Temporary Password:{" "}
              <input
                type="text"
                readOnly
                value={rawPassword || "N/A"}
                className="bg-green-600 text-white border-0 outline-none ml-2"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleAddOrUpdateStaff}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
          >
            {isEditMode ? "Update Staff" : "Add Staff"}
          </button>
        </div>
        {successMessage && (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffForm;
