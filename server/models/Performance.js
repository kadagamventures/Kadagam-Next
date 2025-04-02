const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true, // ✅ Index for faster queries by staff
  },
  attendancePercentage: { type: Number, required: true, min: 0, max: 100, default: 0 },
  taskCompletionRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
  onTimeCompletionRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
  projectsParticipated: { type: Number, required: true, min: 0, default: 0 },
  successRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
  performanceScore: { type: Number, min: 0, max: 100 }, // ✅ Will be auto-calculated
  lastUpdated: { type: Date, default: Date.now }
});

// ✅ Auto-calculate performance score before save
performanceSchema.pre("save", function (next) {
  // Recalculate if not set or explicitly forced
  this.performanceScore = parseFloat(
    (this.attendancePercentage * 0.2) +
    (this.taskCompletionRate * 0.3) +
    (this.onTimeCompletionRate * 0.2) +
    (this.successRate * 0.3)
  ).toFixed(2);

  // Ensure it's within range 0-100
  this.performanceScore = Math.min(Math.max(this.performanceScore, 0), 100);

  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model("Performance", performanceSchema);
