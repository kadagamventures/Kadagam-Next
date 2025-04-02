import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FaProjectDiagram, FaUsers, FaTasks } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" };

        const [overviewRes, chartsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/dashboard/overview`, { headers }),
          axios.get(`${API_BASE_URL}/dashboard/charts`, { headers }),
        ]);

        setDashboardData(overviewRes.data || {});
        setBarChartData(chartsRes.data.barData || []);
        setPieChartData(chartsRes.data.pieData || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  if (loading) {
    return <div className="p-4 text-white">Loading dashboard data...</div>;
  }

  return (
    <div className="pl-0 md:pl-64 p-4 md:p-6 min-h-screen bg-gradient-to-br from-red-500 to-blue-500">
      <h1 className="text-2xl md:text-3xl font-bold text-white pb-2">
        Welcome Kadagam Ventures
      </h1>
      <h3 className="text-base md:text-lg text-white pb-5">
        Manage your organization efficiently
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 md:gap-6">
        {barChartData.map((item, index) => (
          <div key={index} className="bg-white shadow-lg rounded-lg p-6 flex items-center">
            {index === 0 ? (
              <FaProjectDiagram className="text-blue-500 text-3xl mr-4" />
            ) : index === 1 ? (
              <FaUsers className="text-green-500 text-3xl mr-4" />
            ) : (
              <FaTasks className="text-yellow-500 text-3xl mr-4" />
            )}
            <div>
              <h2 className="text-gray-500 text-sm md:text-base">{item.name}</h2>
              <p className="text-xl md:text-2xl font-bold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-700 text-lg font-semibold pb-4">Dashboard Overview</h3>
          {barChartData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <XAxis dataKey="name" stroke="#333" />
                <YAxis stroke="#333" />
                <Tooltip />
                <Bar dataKey="value" fill="#00C49F" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-red-500">⚠️ No Bar Chart Data Available</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-700 text-lg font-semibold pb-4">Task Distribution</h3>
          {pieChartData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => (
                    <text
                      fill="#333"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={12}
                    >
                      {`${name}: ${(percent * 100).toFixed(0)}%`}
                    </text>
                  )}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-red-500">⚠️ No Pie Chart Data Available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
