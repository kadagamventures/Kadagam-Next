import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import axiosInstance from "../../../utils/axiosInstance"; // Secure API requests
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { motion } from "framer-motion";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const StaffReports = () => {
  const [overallData, setOverallData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");

  // Fetch Staff Performance Data
  useEffect(() => {
    const fetchStaffOverview = async () => {
      try {
        const response = await axiosInstance.get("/reports/staff/admin/performance-overview");
        setOverallData(response.data.data);
      } catch (err) {
        console.error("Error fetching staff performance overview:", err);
        setError("Failed to load staff report data. Please check your permissions.");
      } finally {
        setLoading(false);
      }
    };
    fetchStaffOverview();
  }, []);

  if (loading) return <p className="text-center text-gray-500">Loading staff performance data...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  // Destructure overallData with defaults
  const {
    totalStaff = 0,
    activeStaff = 0,
    inactiveStaff = 0,
    attendancePercentage = "0.00",
    taskCompletionRate = "0.00",
    onTimeCompletionRate = "0.00",
    successRate = "0.00",
    topPerformer = null,
  } = overallData || {};

  // Stats Cards Data
  const stats = [
    { title: "Total Staff", value: totalStaff, color: "bg-blue-100 text-blue-700" },
    { title: "Active Staff", value: activeStaff, color: "bg-green-100 text-green-700" },
    { title: "Inactive Staff", value: inactiveStaff, color: "bg-red-100 text-red-700" },
    { title: "Attendance Avg. (%)", value: `${attendancePercentage}%`, color: "bg-purple-100 text-purple-700" },
    { title: "Task Completion Rate", value: `${taskCompletionRate}%`, color: "bg-yellow-100 text-yellow-700" },
    { title: "On-Time Completion (%)", value: `${onTimeCompletionRate}%`, color: "bg-indigo-100 text-indigo-700" },
    { title: "Success Rate (%)", value: `${successRate}%`, color: "bg-rose-300 text-pink-700" },
    { title: "Top Performer", value: topPerformer ? topPerformer.name : "N/A", color: "bg-gray-100 text-gray-700" },
  ];

  // Provided statsColors array (for first 6 cards)
  const statsColors = [
    "bg-gradient-to-r from-green-500 to-green-700",
    "bg-gradient-to-r from-blue-500 to-blue-700",
    "bg-gradient-to-r from-purple-500 to-purple-700",
    "bg-gradient-to-r from-yellow-500 to-yellow-700",
    "bg-gradient-to-r from-red-500 to-red-700",
    "bg-gradient-to-r from-teal-500 to-teal-700",
  ];

  // Chart Data for Task Completion and Attendance
  const taskCompletionData = {
    labels: ["Completed", "Pending", "Overdue"],
    datasets: [
      {
        label: "Task Completion (%)",
        data: [
          parseFloat(taskCompletionRate),
          100 - parseFloat(taskCompletionRate),
          parseFloat(onTimeCompletionRate),
        ],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
      },
    ],
  };

  const attendanceData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        label: "Attendance",
        data: [parseFloat(attendancePercentage), 100 - parseFloat(attendancePercentage)],
        backgroundColor: ["#10B981", "#EF4444"],
      },
    ],
  };

  // Handle Report Download
  const handleDownloadPDF = async () => {
    if (!selectedMonth) return alert("Please select a month to download the report.");
    try {
      const res = await axiosInstance.get("/reports/staff/admin/attendance-monthly/download", {
        params: { month: selectedMonth, year: new Date().getFullYear() },
      });
      if (res.data.success) window.open(res.data.downloadUrl, "_blank");
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download report.");
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header: Title on left, Download Controls on right */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-6 mb-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-800">Staff Reports</h2>
            <p className="text-gray-900 text-lg">Performance and attendance insights.</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              className="border border-gray-300 rounded p-2 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <button
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((item, index) =>
            item.title === "Top Performer" ? (
              <motion.div
                key={index}
                className={`relative p-6 rounded-lg shadow hover:scale-105 transition ${item.color} flex flex-col items-center`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {/* Celebratory Star Effect */}
                <motion.span
                  className="absolute top-2 right-2 text-3xl text-yellow-400"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  ★
                </motion.span>
                <h3 className="text-2xl font-bold">{item.value}</h3>
                <p className="text-sm">{item.title}</p>
              </motion.div>
            ) : (
              <div
                key={index}
                className={`p-6 rounded-lg shadow hover:scale-105 transition ${index < 6 ? statsColors[index] : item.color} flex flex-col items-center`}
              >
                <h3 className="text-2xl font-bold">{item.value}</h3>
                <p className="text-sm">{item.title}</p>
              </div>
            )
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Task Completion Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-[350px] flex flex-col">
            <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">Task Completion</h3>
            <div className="flex-grow">
              <Pie data={taskCompletionData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Attendance Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-[350px] flex flex-col">
            <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">Attendance Overview</h3>
            <div className="flex-grow">
              <Pie data={attendanceData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffReports;
