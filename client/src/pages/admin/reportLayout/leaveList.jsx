import { useEffect, useState } from "react";
import axiosInstance from "../../../utils/axiosInstance"; // ✅ Secure API request
import DatePicker from "react-datepicker"; // ✅ Calendar Date Picker
import "react-datepicker/dist/react-datepicker.css"; // ✅ Styles for Date Picker

const LeaveList = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // ✅ Default: Current Date

  // ✅ Extract year and month dynamically
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1; // Months are 0-based in JS

  // ✅ Fetch leave reports dynamically based on selected year & month
  useEffect(() => {
    const fetchLeaveReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          `/reports/leave/reports/monthly/${selectedYear}/${selectedMonth}`
        );
        setLeaveRequests(response.data); // ✅ Assuming API returns an array
      } catch (err) {
        console.error("Error fetching leave reports:", err);
        setError("Failed to load leave reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveReports();
  }, [selectedYear, selectedMonth]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Monthly Leave Reports
      </h1>

      {/* ✅ Date Picker for Month & Year Selection */}
      <div className="flex justify-center items-center mb-6">
        <label className="text-lg font-semibold mr-3">Select Month:</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          className="border p-2 rounded shadow-md w-48 text-center"
        />
      </div>

      {/* ✅ Loading & Error States */}
      {loading && <p className="text-center text-gray-500">Loading leave reports...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* ✅ Leave Requests Table */}
      {leaveRequests.length > 0 ? (
        <div className="bg-white shadow-lg rounded-xl mx-auto max-w-6xl overflow-x-auto">
          <table className="w-full border-collapse divide-y divide-gray-200">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Staff</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">End Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">{request.staffName}</td>
                  <td className="px-4 py-3">{request.email}</td>
                  <td className="px-4 py-3">{request.startDate}</td>
                  <td className="px-4 py-3">{request.endDate}</td>
                  <td className="px-4 py-3">{request.reason}</td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      request.status === "approved" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {request.status.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center mt-6 text-gray-500">
          No leave requests found for the selected period.
        </p>
      )}
    </div>
  );
};

export default LeaveList;
