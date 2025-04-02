import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaSyncAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { fetchStaffs, deleteStaff } from "../../../redux/slices/staffSlice";

const StaffList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: staff, status, error } = useSelector((state) => state.staff);
  const { role, permissions } = useSelector((state) => state.auth.user) || {};

  // Only admins can delete staff.
  const canDeleteStaff = role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStaff, setFilteredStaff] = useState([]);

  // Fetch staff data when component mounts or on refresh
  useEffect(() => {
    dispatch(fetchStaffs());
  }, [dispatch]);

  // Handle search filtering
  useEffect(() => {
    setFilteredStaff(
      staff.filter((member) => {
        if (!member) return false;
        const memberName = (member.name || "").toLowerCase();
        const memberEmail = (member.email || "").toLowerCase();
        const memberRole = (member.role || "").toLowerCase();
        const memberId = member.staffId ? member.staffId.toString() : "";
        const query = searchQuery.toLowerCase();
        return (
          memberName.includes(query) ||
          memberEmail.includes(query) ||
          memberRole.includes(query) ||
          memberId.includes(query)
        );
      })
    );
  }, [searchQuery, staff]);

  const handleDelete = async (id) => {
    if (!canDeleteStaff) {
      alert("You do not have permission to delete staff.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        const result = await dispatch(deleteStaff(id));
        if (result.meta.requestStatus === "fulfilled") {
          alert("Staff member deleted successfully.");
          // Optionally, re-fetch staff after deletion to refresh state
          dispatch(fetchStaffs());
        } else {
          alert("Failed to delete staff. Please try again.");
        }
      } catch (error) {
        alert("Failed to delete staff. Please try again.");
      }
    }
  };

  // Handler to manually refresh the staff list
  const handleRefresh = () => {
    dispatch(fetchStaffs());
  };

  return (
    <div className="pl-64 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-gradient-to-r from-indigo-500 to-indigo-700 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Staff Members</h2>
        <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 border rounded-full shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none text-gray-700 placeholder-gray-400 bg-white"
            />
            <FaSearch className="absolute right-4 top-3.5 text-gray-400" />
          </div>
          {(role === "admin" || permissions?.includes("manage_staff")) && (
            <Link
              to="/admin/staffs/add"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full transition-all duration-300 flex items-center gap-2 shadow-md"
            >
              <FaPlus className="w-4 h-4" />
              Add Staff
            </Link>
          )}
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full transition-all duration-300 flex items-center gap-2 shadow-md"
          >
            <FaSyncAlt className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {status === "loading" ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">
            Loading staff members...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Staff ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((member, index) => (
                    <tr
                      key={member._id || index}
                      className="hover:bg-gradient-to-r from-gray-50 to-gray-100 transition-all duration-200"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                        {member.staffId || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {member.role}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          {(role === "admin" || permissions?.includes("manage_staff")) && (
                            <button
                              onClick={() => navigate(`/admin/staffs/edit/${member._id}`)}
                              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center gap-1"
                            >
                              <FaEdit className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                          {canDeleteStaff && (
                            <button
                              onClick={() => handleDelete(member._id)}
                              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center gap-1"
                            >
                              <FaTrash className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No staff members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffList;
