import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance"; // ✅ Uses your custom axios instance
import AdminSidebar from "../../components/sidebar";

const DailyStatusDashboard = () => {
  const [dailyUpdates, setDailyUpdates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch daily comments from backend
  useEffect(() => {
    const fetchDailyComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get("/tasks/daily-comments");
        const tasks = response.data;

        const flattenedUpdates = [];
        tasks.forEach((task) => {
          if (task.dailyUpdates && task.dailyUpdates.length > 0) {
            task.dailyUpdates.forEach((update) => {
              flattenedUpdates.push({
                staffName: update.staffId?.name || "N/A",
                taskId: task._id,
                taskTitle: task.title || "Untitled Task",
                dailyStatus: update.comment,
                date: update.date,
              });
            });
          }
        });

        setDailyUpdates(flattenedUpdates);
      } catch (err) {
        console.error("❌ Error fetching daily comments:", err);
        setError("Failed to load daily comments. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDailyComments();
  }, []);

  // ✅ Filter updates by staff name or task ID
  const filteredUpdates = dailyUpdates.filter((update) => {
    if (!searchTerm) return true;
    return (
      update.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      update.taskId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-grow p-8 ml-64">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-800">
              Daily Task Updates
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              View and manage daily task update statuses
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Staff Name or Task ID..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="absolute right-3 top-3.5 h-5 w-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center py-4 text-blue-600 font-semibold">
              Loading daily updates...
            </div>
          )}
          {error && (
            <div className="text-center py-4 text-red-500 font-semibold">
              {error}
            </div>
          )}

          {/* Updates Table */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Staff Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Task ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Task Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Date &amp; Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUpdates.map((update, index) => (
                    <tr
                      key={`${update.taskId}-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                        {update.staffName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                        {update.taskId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                        {update.taskTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-gray-800">
                        {update.dailyStatus}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(update.date).toLocaleString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUpdates.length === 0 && (
                <div className="text-center py-12 bg-gray-50">
                  <div className="mb-4 text-gray-400">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-gray-500 text-lg font-medium">
                    No updates found
                  </h3>
                  <p className="text-gray-400 mt-1">
                    Try adjusting your search terms
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyStatusDashboard;
