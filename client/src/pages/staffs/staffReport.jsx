import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import StaffSidebar from "../../components/staffSidebar";
import { Doughnut, Bar } from "react-chartjs-2";
import axiosInstance from "../../utils/axiosInstance";
import "chart.js/auto";

const StaffReport = () => {
  const user = useSelector((state) => state.staffAuth.user);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch performance data when user or filter changes
  useEffect(() => {
    if (!user?.id) return;
    const fetchPerformance = async () => {
      setLoading(true);
      try {
        const endpoint = `/performance/staff/${user.id}/monthly?year=${selectedYear}&month=${selectedMonth}`;
        const res = await axiosInstance.get(endpoint);
        setPerformance(res.data.success ? res.data.data : null);
      } catch (error) {
        console.error("❌ Error fetching performance data:", error);
        setPerformance(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [user?.id, selectedYear, selectedMonth]);

  if (loading)
    return (
      <div className="text-center p-8 text-xl font-semibold">
        Loading Performance Data...
      </div>
    );
  if (!performance)
    return (
      <div className="text-center p-8 text-red-600 text-xl font-semibold">
        No Data Found for this Month
      </div>
    );

  // InfoBox component with Framer Motion animation
  const InfoBox = ({ label, value, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-xl shadow-md bg-gradient-to-r ${color} text-white text-center`}
    >
      <h3 className="text-sm font-medium">{label}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </motion.div>
  );

  // Chart animation variants
  const chartVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <StaffSidebar />
      <div className="flex-grow p-8 ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header & Filters */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4"
          >
            <h1 className="text-3xl font-bold text-gray-800">
              My Monthly Performance
            </h1>
            <div className="flex gap-3">
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 bg-white"
                placeholder="Year"
              />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 bg-white"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Performance Info Boxes */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8"
          >
            <InfoBox
              label="Total Tasks Assigned"
              value={performance.totalTasksAssigned}
              color="from-blue-400 to-blue-600"
            />
            <InfoBox
              label="Tasks Completed"
              value={performance.totalTasksCompleted}
              color="from-green-400 to-green-600"
            />
            <InfoBox
              label="Task Completion Rate"
              value={`${performance.taskCompletionRate}%`}
              color="from-purple-400 to-purple-600"
            />
            <InfoBox
              label="On-Time Completion"
              value={`${performance.onTimeCompletionRate}%`}
              color="from-yellow-400 to-yellow-600"
            />
            <InfoBox
              label="Overdue Tasks"
              value={performance.overdueTasks}
              color="from-red-400 to-red-600"
            />
            <InfoBox
              label="High Priority Done"
              value={performance.highPriorityTasksCompleted}
              color="from-pink-400 to-pink-600"
            />
            <InfoBox
              label="Ongoing Tasks"
              value={performance.ongoingTasks}
              color="from-indigo-400 to-indigo-600"
            />
            <InfoBox
              label="Present Days"
              value={performance.totalDaysPresent}
              color="from-green-300 to-green-500"
            />
            <InfoBox
              label="Absent Days"
              value={performance.totalDaysAbsent}
              color="from-rose-400 to-rose-600"
            />
            <InfoBox
              label="Attendance %"
              value={`${performance.attendancePercentage}%`}
              color="from-teal-400 to-teal-600"
            />
            <InfoBox
              label="Success Rate"
              value={`${performance.successRate}%`}
              color="from-lime-400 to-lime-600"
            />
            <InfoBox
              label="Overall Score"
              value={`${performance.overallPerformanceScore}/100`}
              color="from-fuchsia-400 to-fuchsia-600"
            />
          </motion.div>

          {/* Data Visualizations */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Task Distribution Doughnut Chart */}
            <motion.div
  variants={chartVariants}
  className="bg-white p-6 rounded-xl shadow-lg flex justify-center"
>
  <div className="text-center">
    <h2 className="text-lg font-semibold mb-3 text-gray-700">
      Task Distribution
    </h2>
    <div className="h-64 flex justify-center">
      <Doughnut
        data={{
          labels: ["Completed", "Ongoing", "Overdue"],
          datasets: [
            {
              data: [
                performance.totalTasksCompleted,
                performance.ongoingTasks,
                performance.overdueTasks,
              ],
              backgroundColor: ["#4ade80", "#facc15", "#f87171"],
            },
          ],
        }}
      />
    </div>
  </div>
</motion.div>


            {/* Performance Metrics Bar Chart */}
            <motion.div
              variants={chartVariants}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <h2 className="text-lg font-semibold mb-3 text-gray-700">
                Performance Metrics
              </h2>
              <div className="h-64">
                <Bar
                  data={{
                    labels: [
                      "Completion %",
                      "On-Time %",
                      "Attendance %",
                      "Success %",
                      "Overall Score",
                    ],
                    datasets: [
                      {
                        label: "Performance",
                        data: [
                          performance.taskCompletionRate,
                          performance.onTimeCompletionRate,
                          performance.attendancePercentage,
                          performance.successRate,
                          performance.overallPerformanceScore,
                        ],
                        backgroundColor: [
                          "#3B82F6",
                          "#10B981",
                          "#F59E0B",
                          "#6366F1",
                          "#8B5CF6",
                        ],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, max: 100 } },
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StaffReport;
