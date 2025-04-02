import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import axiosInstance from "../../../utils/axiosInstance";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Attendance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch attendance data when selectedDate changes
  useEffect(() => {
    fetchAttendanceData(selectedDate);
  }, [selectedDate]);

  // Fetch attendance data from API
  const fetchAttendanceData = async (date) => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/reports/attendance/daily`, {
        params: { date },
      });
      if (res.data.success) {
        setAttendanceData(res.data.data);
      } else {
        setError("Failed to fetch attendance data.");
      }
    } catch (err) {
      console.error("Error fetching attendance data:", err);
      setError("Error fetching attendance data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle monthly report download
  const handleDownloadPDF = async () => {
    if (!month) {
      alert("Please select a month to download the report.");
      return;
    }
    try {
      const res = await axiosInstance.get(`/reports/attendance/monthly/download`, {
        params: { month, year: new Date().getFullYear() },
      });
      if (res.data.success) {
        window.open(res.data.downloadUrl, "_blank");
      } else {
        alert("Error generating PDF. Please try again.");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download the report. Please try again later.");
    }
  };

  // Define chart data and options
  const chartData = {
    labels: ["Present", "Absent", "Late Arrivals", "Early Departures", "On Leave"],
    datasets: [
      {
        label: "Attendance",
        data: attendanceData
          ? [
              attendanceData.presentStaff || 0,
              attendanceData.absentStaff || 0,
              attendanceData.lateArrivals || 0,
              attendanceData.earlyDepartures || 0,
              attendanceData.onLeave || 0,
            ]
          : [0, 0, 0, 0, 0],
        backgroundColor: ["#10B981", "#EF4444", "#F59E0B", "#8B5CF6", "#6366F1"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Daily Attendance Distribution" },
    },
  };

  // Colors for stats cards
  const statsColors = [
    "bg-gradient-to-r from-green-500 to-green-700",
    "bg-gradient-to-r from-blue-500 to-blue-700",
    "bg-gradient-to-r from-purple-500 to-purple-700",
    "bg-gradient-to-r from-yellow-500 to-yellow-700",
    "bg-gradient-to-r from-red-500 to-red-700",
    "bg-gradient-to-r from-teal-500 to-teal-700",
  ];

  // Animation variants for container and cards
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-center border-b pb-6 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-extrabold text-gray-800">Attendance Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="bg-white shadow rounded-lg p-4">
              <p className="text-2xl font-semibold text-indigo-600">
                {currentTime.toLocaleTimeString()}
              </p>
              <p className="text-sm text-gray-500">
                {currentTime.toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <label htmlFor="attendance-date" className="text-lg font-medium text-gray-700">
              Select Date:
            </label>
            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Month</option>
              {[...Array(12)].map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {new Date(0, idx).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <motion.button
              onClick={handleDownloadPDF}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
              whileHover={{ scale: 1.05 }}
            >
              Download PDF
            </motion.button>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && <p className="text-indigo-600 text-lg">Loading data...</p>}
        {error && <p className="text-red-600 text-lg">{error}</p>}

        {/* Stats Cards */}
        {attendanceData && !loading && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { label: "Total Staff", value: attendanceData.totalStaff },
              { label: "Present", value: attendanceData.presentStaff },
              { label: "Absent", value: attendanceData.absentStaff },
              { label: "Late Arrivals", value: attendanceData.lateArrivals },
              { label: "Early Departures", value: attendanceData.earlyDepartures },
              { label: "On Leave", value: attendanceData.onLeave },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className={`p-6 rounded-lg shadow transform transition duration-300 hover:scale-105 ${statsColors[idx % statsColors.length]} text-white`}
                variants={cardVariants}
              >
                <h3 className="text-lg font-semibold">{item.label}</h3>
                <p className="text-3xl font-bold mt-2">{item.value}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pie Chart */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Attendance Distribution</h2>
          <div className="h-80">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Attendance;
