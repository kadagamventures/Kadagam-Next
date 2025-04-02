import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaPlus, FaSearch } from "react-icons/fa";
import PropTypes from "prop-types";
import { fetchStaffs } from "../../../redux/slices/staffSlice";

const StaffList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: staff, status, error } = useSelector((state) => state.staff);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchStaffs());
    }
  }, [dispatch, status]);

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.staffId?.toString().includes(searchQuery)
  );

  return (
    <div className="pl-64 min-h-screen bg-gradient-to-br from-blue-500 via-red-500 to-pink-500 p-8 flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-300">
        <h1 className="text-3xl font-bold text-gray-800 pb-2">Staff Members</h1>

        {/* Search Bar */}
        <div className="relative w-full md:w-1/3 mt-4 md:mt-0">
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 text-gray-700 bg-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-500" />
        </div>

        {/* ➕ Add New Staff Button */}
        <Link
          to="/staff/staffs/add"
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-blue-300 flex items-center gap-2 shadow-md"
        >
          <FaPlus className="w-5 h-5" /> Add New Staff
        </Link>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-300">
        {status === "loading" ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading staff...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filteredStaff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-blue-500 to-red-500 text-white text-sm uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Staff ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 bg-gray-50">
                {filteredStaff.map((member, index) => (
                  <tr
                    key={member._id}
                    className={`hover:bg-indigo-100 transition-all ${
                      index % 2 === 0 ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4 text-gray-800 font-medium">
                      {member.staffId || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{member.name}</td>
                    <td className="px-6 py-4 text-gray-600">{member.role}</td>
                    <td className="px-6 py-4 text-gray-600">{member.email}</td>
                    <td className="px-6 py-4 text-center">
                      {/* ✅ Perfectly Aligned Edit Button */}
                      <button
                        onClick={() => navigate(`/staff/staffs/edit/${member._id}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-24 shadow-md transition-all duration-300 transform hover:bg-blue-700 hover:scale-105 focus:ring-4 focus:ring-blue-300"
                      >
                        <FaEdit className="w-4 h-4" />
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">No staff members found.</div>
        )}
      </div>
    </div>
  );
};

StaffList.propTypes = {
  staff: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      staffId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
};

export default StaffList;
