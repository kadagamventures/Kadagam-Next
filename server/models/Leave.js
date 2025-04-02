const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["leave", "workfromhome", "declared_leave"], // ✅ Allowed types
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      required: true,
      maxlength: 500, // ✅ Restrict reason to 500 characters
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },
    contactEmail: {
      type: String,
      trim: true,
      required: true,
      validate: {
        validator: function (v) {
          return /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v); // ✅ Valid email check
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false, // ✅ Enables soft delete
    },
  },
  { timestamps: true }
);

// ✅ Ensure `startDate` is not after `endDate`
leaveSchema.pre("validate", function (next) {
  if (this.startDate > this.endDate) {
    return next(new Error("Start date cannot be after end date."));
  }
  next();
});

// ✅ Prevent overlapping leaves
leaveSchema.pre("save", async function (next) {
  const existingLeave = await this.constructor.findOne({
    staff: this.staff,
    startDate: { $lte: this.endDate },
    endDate: { $gte: this.startDate },
    isDeleted: false,
  });

  if (existingLeave) {
    return next(new Error("You already have a leave request for this period."));
  }
  next();
});

// ✅ Restrict leave requests for past dates (Optional)
leaveSchema.pre("validate", function (next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize time for accurate comparison

  if (this.startDate < today) {
    return next(new Error("Cannot request leave for past dates."));
  }
  next();
});

// ✅ Auto-trim before saving
leaveSchema.pre("save", function (next) {
  this.reason = this.reason.trim();
  this.contactEmail = this.contactEmail.trim();
  next();
});

// ✅ Exclude soft-deleted records from queries
leaveSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

// ✅ Automatically update status for past dates
leaveSchema.pre("save", function (next) {
  if (this.endDate < new Date() && this.status === "pending") {
    this.status = "expired"; // Auto-expire outdated leave requests
  }
  next();
});



module.exports = mongoose.model("Leave", leaveSchema);
