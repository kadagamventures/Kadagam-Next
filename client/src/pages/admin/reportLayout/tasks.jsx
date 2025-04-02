import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import axiosInstance from "../../../utils/axiosInstance";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Task = () => {
  const [taskStats, setTaskStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");

  // Stats colors array
  const statsColors = [
    "bg-gradient-to-r from-green-500 to-green-700",
    "bg-gradient-to-r from-blue-500 to-blue-700",
    "bg-gradient-to-r from-purple-500 to-purple-700",
    "bg-gradient-to-r from-yellow-500 to-yellow-700",
    "bg-gradient-to-r from-red-500 to-red-700",
    "bg-gradient-to-r from-teal-500 to-teal-700",
  ];

  // Fetch task stats & visualization data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsResponse = await axiosInstance.get("/reports/tasks/live-stats");
        setTaskStats(statsResponse.data.stats);

        // Generate chart data based on response
        setChartData({
          completionTrend: {
            labels: ["Total", "Completed", "Ongoing", "Overdue", "To Do"],
            datasets: [
              {
                label: "Tasks Overview",
                data: [
                  statsResponse.data.stats.totalTasks,
                  statsResponse.data.stats.completedTasks,
                  statsResponse.data.stats.ongoingTasks,
                  statsResponse.data.stats.overdueTasks,
                  statsResponse.data.stats.toDoTasks,
                ],
                backgroundColor: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#EAB308"],
              },
            ],
          },
          priorityDistribution: {
            labels: ["High Priority", "Other Tasks"],
            datasets: [
              {
                data: [
                  statsResponse.data.stats.highPriorityTasks,
                  statsResponse.data.stats.totalTasks - statsResponse.data.stats.highPriorityTasks,
                ],
                backgroundColor: ["#EF4444", "#10B981"],
              },
            ],
          },
        });
      } catch (error) {
        console.error("Error fetching task stats:", error);
      }
    };

    fetchData();
  }, []);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Task Overview" },
    },
  };

  // Download report
  const handleDownloadReport = async () => {
    if (!selectedMonth) {
      alert("Please select a month first.");
      return;
    }
    try {
      const response = await axiosInstance.get(
        `/reports/tasks/download?year=${new Date().getFullYear()}&month=${selectedMonth}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `task_report_${selectedMonth}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header: Title on left, Date Selection & Download on right */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-6 mb-8">
          <div>
            <h2 className="text-4xl font-extrabold text-gray-800">Task Reports</h2>
            <p className="text-gray-700 text-lg">
              Live updates of task status and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              className="border border-gray-300 rounded p-2 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">Select Month</option>
              {[...Array(12)].map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {new Date(0, idx).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <button
              onClick={handleDownloadReport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {taskStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
            {[
              { label: "Total Tasks", value: taskStats.totalTasks },
              { label: "Completed", value: taskStats.completedTasks },
              { label: "Ongoing", value: taskStats.ongoingTasks },
              { label: "Overdue", value: taskStats.overdueTasks },
              { label: "To Do", value: taskStats.toDoTasks },
              { label: "High Priority", value: taskStats.highPriorityTasks },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-lg shadow hover:scale-105 transition ${statsColors[idx % statsColors.length]} text-white`}
              >
                <h3 className="text-lg font-semibold">{item.label}</h3>
                <p className="text-3xl font-bold mt-2">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Charts Section */}
        {chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Task Completion Overview (Bar Chart) */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-[350px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Completion Overview</h3>
              <div className="flex-grow">
                <Bar data={chartData.completionTrend} options={chartOptions} />
              </div>
            </div>

            {/* Task Priority Distribution (Pie Chart) */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-[350px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Priority Distribution</h3>
              <div className="flex-grow">
                <Pie data={chartData.priorityDistribution} options={chartOptions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Task;
