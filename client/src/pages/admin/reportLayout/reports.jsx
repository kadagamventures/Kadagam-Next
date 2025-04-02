import { Bar, Pie } from "react-chartjs-2";
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
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

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

const Reports = () => {
  const [overviewData, setOverviewData] = useState({
    totalProjects: 0,
    totalStaff: 0,
    totalTasks: 0,
    ongoingTasks: 0,
    completedTasks: 0,
    toDoTasks: 0,
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/reports/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res?.data?.success) {
          const data = res.data.data;
          setOverviewData({
            totalProjects: data.totalProjects || 0,
            totalStaff: data.totalStaff || 0,
            totalTasks: data.totalTasks || 0,
            ongoingTasks: data.ongoingTasks || 0,
            completedTasks: data.completedTasks || 0,
            toDoTasks: data.toDoTasks || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching overview data:", error);
      }
    };

    fetchOverview();
  }, []);

  const colors = [
    "bg-gradient-to-r from-green-500 to-green-700",
    "bg-gradient-to-r from-blue-500 to-blue-700",
    "bg-gradient-to-r from-purple-500 to-purple-700",
    "bg-gradient-to-r from-yellow-500 to-yellow-700",
    "bg-gradient-to-r from-red-500 to-red-700",
    "bg-gradient-to-r from-teal-500 to-teal-700"
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: "#333", font: { weight: "500" } } },
      title: { display: true, color: "#222", font: { size: 16 } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#555" } },
      y: { grid: { color: "#ddd" }, ticks: { color: "#555" } },
    },
  };

  const projectsStaffChartData = {
    labels: ["Total Projects", "Total Staff", "Total Tasks"],
    datasets: [
      {
        label: "Overview",
        data: [
          overviewData.totalProjects,
          overviewData.totalStaff,
          overviewData.totalTasks,
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const tasksDistributionChartData = {
    labels: ["Ongoing Tasks", "Completed Tasks", "To Do Tasks"],
    datasets: [
      {
        label: "Task Stats",
        data: [
          overviewData.ongoingTasks,
          overviewData.completedTasks,
          overviewData.toDoTasks,
        ],
        backgroundColor: ["#8B5CF6", "#22C55E", "#3B82F6"],
      },
    ],
  };

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <motion.h2
        className="text-5xl font-bold text-gray-800 mb-10 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Analytics Dashboard
      </motion.h2>

      {/* Overview Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.2 }}
      >
        {Object.entries(overviewData).map(([key, value], index) => (
          <motion.div
            key={key}
            className={`p-6 rounded-xl shadow-lg border border-gray-200 
            text-white ${colors[index % colors.length]} hover:shadow-xl transition-shadow duration-300`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <h3 className="text-4xl font-bold">{value}</h3>
            <p className="mt-2 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.3 }}
      >
        {/* Projects, Staff, Tasks Bar Chart */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">Projects, Staff & Tasks</h3>
          <div className="h-96">
            <Bar data={projectsStaffChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Task Distribution Pie Chart */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">Task Distribution</h3>
          <div className="h-96">
            <Pie data={tasksDistributionChartData} options={chartOptions} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Reports;
