import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitLeaveRequest } from "../../redux/slices/leaveRequestSlice";

const StaffLeaveRequest = () => {
  const dispatch = useDispatch();
  // Get Redux state for leave request submission
  const { loading, error, success } = useSelector(
    (state) =>
      state.leaveRequest || { loading: false, error: null, success: false }
  );

  const [requestType, setRequestType] = useState("leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Retrieve staff email from localStorage (stored as "staffEmail")
    const staffEmail = localStorage.getItem("staffEmail") || "";
    setEmail(staffEmail);
  }, []);

  // Update local message based on Redux state changes
  useEffect(() => {
    if (success) {
      setMessage("Request submitted successfully!");
      // Clear form fields after successful submission (except email)
      setRequestType("leave");
      setStartDate("");
      setEndDate("");
      setReason("");
    }
    if (error) {
      setMessage("Error submitting request. Please try again later.");
    }
  }, [success, error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Map UI value to backend expected type
    const type = requestType === "work-from-home" ? "workfromhome" : "leave";
    // Prepare payload for the leave request; backend expects field "contactEmail"
    const payload = { type, startDate, endDate, reason, contactEmail: email };
    dispatch(submitLeaveRequest(payload));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-300 to-purple-300 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Leave / Work From Home Request
        </h1>
        {message && (
          <p className="mb-6 text-center text-green-600 font-semibold">
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Request Type
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="leave">Leave</option>
              <option value="work-from-home">Work From Home</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              rows="4"
              placeholder="Enter your reason for the request..."
              required
            ></textarea>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-lg"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffLeaveRequest;
