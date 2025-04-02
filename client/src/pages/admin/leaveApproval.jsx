import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { format } from "date-fns";

const LeaveApproval = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState(null); // Track which request is being processed

  // Fetch pending leave requests
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const response = await axiosInstance.get("/leave/pending");
        // Ensure it correctly extracts leaveRequests array
        setLeaveRequests(response.data.leaveRequests || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch leave requests. Please try again.");
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  // Handle Approval/Rejection
  const handleApproval = async (leaveId, newStatus) => {
    setProcessingId(leaveId); // Show loading state on buttons
    try {
      const endpoint =
        newStatus === "approved"
          ? `/leave/approve/${leaveId}`
          : `/leave/reject/${leaveId}`;
      await axiosInstance.patch(endpoint);

      // Update UI immediately after approval/rejection
      setLeaveRequests((prevRequests) =>
        prevRequests.map((request) =>
          request._id === leaveId ? { ...request, status: newStatus } : request
        )
      );
      setMessage(`Request ${newStatus} successfully!`);
    } catch (err) {
      setError(`Failed to ${newStatus} request. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pl-64 p-6">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
        Leave Approval
      </h1>

      {message && (
        <p className="mb-6 text-center text-green-600 font-medium">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-6 text-center text-red-600 font-medium">{error}</p>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading leave requests...</p>
      ) : leaveRequests.length === 0 ? (
        <p className="text-center text-gray-500">No pending leave requests.</p>
      ) : (
        <div className="bg-white shadow-lg rounded-xl">
          <table className="w-full divide-y divide-gray-200 table-auto border-collapse">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests.map((request) => (
                <tr
                  key={request._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-800">
                    {request.staff.email}
                  </td>
                  <td className="px-6 py-4 text-gray-800 capitalize">
                    {request.type.replace("-", " ")}
                  </td>
                  <td className="px-6 py-4 text-gray-800">
                    {format(new Date(request.startDate), "MM/dd/yyyy")}
                  </td>
                  <td className="px-6 py-4 text-gray-800">
                    {format(new Date(request.endDate), "MM/dd/yyyy")}
                  </td>
                  <td className="px-6 py-4 text-gray-800">{request.reason}</td>
                  <td
                    className={`px-6 py-4 font-semibold ${
                      request.status === "approved"
                        ? "text-green-600"
                        : request.status === "rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {request.status.toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    {request.status === "pending" ? (
                      <div className="flex justify-center space-x-2">
                        <button
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm"
                          onClick={() =>
                            handleApproval(request._id, "approved")
                          }
                          disabled={processingId === request._id}
                        >
                          {processingId === request._id
                            ? "Processing..."
                            : "Approve"}
                        </button>
                        <button
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-sm"
                          onClick={() =>
                            handleApproval(request._id, "rejected")
                          }
                          disabled={processingId === request._id}
                        >
                          {processingId === request._id
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-600">
                        {request.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;
