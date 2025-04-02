const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date, // ✅ Ensures correct date handling
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
      validate: {
        validator: function (value) {
          return !this.checkInTime || (value && value > this.checkInTime);
        },
        message: "Check-out time must be after check-in time.",
      },
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "Present",
        "Absent",
        "Late Arrival",
        "On Leave",
        "Early Departure",
        "Declared Holiday",
      ],
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Compound unique index (Ensures 1 attendance record per staff per day)
AttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

/**
 * 🔹 Normalize the date to midnight (UTC) for consistency.
 */
const normalizeDate = (date) => {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

/**
 * 🔹 Calculate total worked hours (ensures accuracy).
 */
const calculateTotalHours = (checkIn, checkOut) => {
  return parseFloat(((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2));
};

/**
 * ✅ Pre-save hook:
 * - Normalizes the date field to midnight (UTC).
 * - Calculates total hours if check-out time is set.
 * - Adjusts status based on check-in time, work hours, and day of the week.
 */
AttendanceSchema.pre("save", function (next) {
  if (this.date) {
    this.date = normalizeDate(this.date);
  }

  const dayOfWeek = this.date.getDay(); // 0 = Sunday
  if (dayOfWeek === 0) {
    this.status = "Declared Holiday";
    return next(); // Skip further processing for holidays
  }

  // ✅ Calculate total work hours if check-out is available
  if (this.checkInTime && this.checkOutTime) {
    this.totalHours = calculateTotalHours(this.checkInTime, this.checkOutTime);

    if (this.totalHours >= 10) {
      this.status = "Present";
    } else if (this.totalHours > 0) {
      this.status = "Early Departure";
    }
  }

  // ✅ Apply Late Arrival logic
  if (this.checkInTime) {
    const checkInHour = this.checkInTime.getUTCHours();
    if (checkInHour > 9 && !["Present", "Early Departure"].includes(this.status)) {
      this.status = "Late Arrival";
    }
  }

  // ✅ Mark "Absent" if no check-in is recorded
  if (!this.checkInTime) {
    this.status = "Absent";
  }

  next();
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
