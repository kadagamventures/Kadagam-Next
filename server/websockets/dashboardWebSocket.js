const adminDashboardService = require("../services/adminDashboardService");

const dashboardWebSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Dashboard WebSocket Connected");

    // Send initial dashboard data
    const sendDashboardUpdate = async () => {
      const overviewData = await adminDashboardService.getOverviewData();
      socket.emit("dashboardUpdate", overviewData);
    };

    sendDashboardUpdate(); // Send on connection

    // Listen for update triggers (example: when a task is updated)
    socket.on("updateDashboard", async () => {
      await sendDashboardUpdate();
    });

    socket.on("disconnect", () => {
      console.log("Dashboard WebSocket Disconnected");
    });
  });
};

module.exports = dashboardWebSocket;
