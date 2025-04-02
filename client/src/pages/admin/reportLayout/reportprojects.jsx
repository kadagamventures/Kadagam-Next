import { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import axiosInstance from "../../../utils/axiosInstance"; // Global Axios Instance
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ProjectReports = () => {
  const [projectStats, setProjectStats] = useState(null);
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

  // Fetch Live Project Statistics
  useEffect(() => {
    const fetchProjectStats = async () => {
      try {
        const response = await axiosInstance.get("/reports/projects/live-overview"); // API Call
        setProjectStats(response.data.data);

        // Update Chart Data
        setChartData({
          completionTrend: {
            labels: ["Total", "Completed", "Ongoing", "Overdue", "Cancelled", "Pending"],
            datasets: [
              {
                label: "Projects Overview",
                data: [
                  response.data.data.totalProjects,
                  response.data.data.completedProjects,
                  response.data.data.ongoingProjects,
                  response.data.data.overdueProjects,
                  response.data.data.cancelledProjects,
                  response.data.data.pendingProjects,
                ],
                backgroundColor: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#34D399"],
              },
            ],
          },
          statusBreakdown: {
            labels: ["Completed", "Ongoing", "Overdue", "Cancelled", "Pending"],
            datasets: [
              {
                data: [
                  response.data.data.completedProjects,
                  response.data.data.ongoingProjects,
                  response.data.data.overdueProjects,
                  response.data.data.cancelledProjects,
                  response.data.data.pendingProjects,
                ],
                backgroundColor: ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#34D399"],
              },
            ],
          },
        });
      } catch (error) {
        console.error("Error fetching project statistics:", error);
      }
    };

    fetchProjectStats();
  }, []);

  // Download Monthly Report
  const handleDownloadPDF = async () => {
    if (!selectedMonth) {
      alert("Please select a month first.");
      return;
    }
    try {
      const response = await axiosInstance.get(
        `/reports/projects/monthly-report/download?year=${new Date().getFullYear()}&month=${selectedMonth}`
      );

      if (response.data.success) {
        window.open(response.data.downloadUrl, "_blank");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  // Chart Config
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Project Overview" },
    },
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header: Title on left, Month Selection & Download on right */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-6 mb-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-800">Project Reports</h2>
            <p className="text-gray-700 text-lg">Live project status and progress insights</p>
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
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {projectStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
            {[
              { label: "Total Projects", value: projectStats.totalProjects },
              { label: "Completed", value: projectStats.completedProjects },
              { label: "Ongoing", value: projectStats.ongoingProjects },
              { label: "Overdue", value: projectStats.overdueProjects },
              { label: "Cancelled", value: projectStats.cancelledProjects },
              { label: "Pending", value: projectStats.pendingProjects },
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
            {/* Bar Chart: Project Overview */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-[350px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Overview</h3>
              <div className="flex-grow">
                <Bar data={chartData.completionTrend} options={chartOptions} />
              </div>
            </div>

            {/* Pie Chart: Project Status Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-[350px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Status Breakdown</h3>
              <div className="flex-grow">
                <Pie data={chartData.statusBreakdown} options={chartOptions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectReports;
