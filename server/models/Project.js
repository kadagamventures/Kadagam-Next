const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    relatedTo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedStaff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // ✅ Track assigned staff members

    status: {
      type: String,
      enum: ["Pending", "Ongoing", "Completed", "Cancelled"],
      default: "Pending",
    }, // ✅ Track project progress

    startDate: {
      type: Date,
      required: true,
    }, // ✅ Start date of project

    endDate: {
      type: Date,
      required: false,
    }, // ✅ End date of project (auto-set on completion)

    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ], // ✅ Track associated tasks

    completedTasks: {
      type: Number,
      default: 0,
    }, // ✅ Count of completed tasks in the project

    totalTasks: {
      type: Number,
      default: 0,
    }, // ✅ Count of total tasks in the project

    completionRate: {
      type: Number,
      default: 0,
    }, // ✅ Auto-updated project progress percentage

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/**
 * ✅ Auto-exclude soft-deleted projects from queries
 */
ProjectSchema.pre(/^find/, function (next) {
  this.setQuery({ ...this.getQuery(), isDeleted: false });
  next();
});

/**
 * ✅ Auto-update completion rate & set endDate before saving
 */
ProjectSchema.pre("save", function (next) {
  // ✅ Auto-calculate completion rate (ensure it's a number)
  if (this.totalTasks > 0) {
    this.completionRate = parseFloat(((this.completedTasks / this.totalTasks) * 100).toFixed(2));
  } else {
    this.completionRate = 0;
  }

  // ✅ Auto-set `endDate` when project is completed
  if (this.status === "Completed" && !this.endDate) {
    this.endDate = new Date();
  }

  next();
});

module.exports = mongoose.model("Project", ProjectSchema);
