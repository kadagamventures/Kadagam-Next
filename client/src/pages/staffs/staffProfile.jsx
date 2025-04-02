import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/kadagamlogo.png";

const StaffProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Staff state initialized
  const [staff, setStaff] = useState({
    profilePic: logo, // Default Profile Picture
    name: "",
    email: "",
    role: "",
    phone: "",
    salary: "",
    staffId: "",
  });

  // ✅ Fetch Staff Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get("/staff/profile");
        if (response.data?.success) {
          setStaff(response.data.staff);
        } else {
          throw new Error(response.data.message || "Failed to load profile");
        }
      } catch (error) {
        console.error("❌ Error fetching profile:", error);
        setError("Failed to fetch profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ✅ Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    navigate("/staff/login");
  };

  // ✅ Navigate to Leave Request Form
  const handleAskLeave = () => {
    navigate("/staff/ask-leave");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center px-4 py-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg min-h-[500px] overflow-hidden transition-all duration-300 transform hover:scale-105">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-red-500 to-blue-500 p-6 pb-14 relative">
          <div className="absolute inset-x-0 -bottom-14 flex justify-center">
            <img
              src={staff.profilePic || logo}
              alt="Profile"
              className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover transition-transform hover:scale-110"
            />
          </div>
        </div>

        {/* Loading & Error Handling */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">⏳ Loading profile...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-bold">{error}</p>
          </div>
        ) : (
          <>
            {/* Profile Content */}
            <div className="pt-16 px-6 pb-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{staff.name}</h2>
                <p className="text-indigo-600 font-medium text-md">{staff.role}</p>
              </div>

              {/* Details Grid */}
              <div className="space-y-5">
                <DetailItem label="📧 Email" value={staff.email} />
                <DetailItem label="📞 Phone" value={staff.phone} />
                <DetailItem label="💸 Salary" value={`₹${staff.salary}`} />
                <DetailItem label="🆔 Staff ID" value={staff.staffId} />
              </div>

              {/* Action Buttons Centered */}
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={handleAskLeave}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all transform hover:scale-105 text-sm"
                >
                  ✨ Ask Leave
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg transition-all transform hover:scale-105 text-sm"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ✅ Reusable DetailItem Component
const DetailItem = ({ label, value }) => (
  <div className="flex items-center p-4 bg-gray-50 rounded-lg shadow-md hover:bg-gray-100 transition-all">
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-700 text-sm">{value || "N/A"}</p>
    </div>
  </div>
);

export default StaffProfile;
