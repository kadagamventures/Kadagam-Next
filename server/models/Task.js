const mongoose = require("mongoose");

// ✅ Schema for Daily Updates (Staff comments on progress)
const dailyUpdateSchema = new mongoose.Schema({
    staffId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
    },
    comment: { 
        type: String, 
        required: true,
        trim: true 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
});

// ✅ Schema for Attachments (AWS S3 files)
const attachmentSchema = new mongoose.Schema({
    fileUrl: {
        type: String,
        trim: true,
        required: true,
    },
    fileType: {
        type: String,
        trim: true,
        required: true,
    },
});

const TaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 200,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        projects: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Project",
                required: true,
            },
        ],
        // ✅ Single Staff Assignment enforced (NOT ARRAY)
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["To Do", "Ongoing", "Completed", "Overdue"],
            default: "To Do",
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Medium",
        },
        dueDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return value >= today;
                },
                message: "Due date must be in the future",
            },
        },
        attachments: [attachmentSchema],
        dailyUpdates: [dailyUpdateSchema],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false, // Soft delete support
        },
    },
    { timestamps: true }
);

// ✅ Middleware for Auto-Handling Task Status and Due Dates
TaskSchema.pre("save", function (next) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.isModified("dueDate") && this.dueDate < today) {
        return next(new Error("Due date must be in the future."));
    }

    if (this.isModified("status")) {
        if (this.status === "Completed" && !this.completedAt) {
            this.completedAt = new Date();
        } else if (this.status !== "Completed") {
            this.completedAt = null;
        }
    }

    if (this.status !== "Completed" && this.dueDate < today) {
        this.status = "Overdue";
    }

    next();
});

// ✅ Auto-exclude soft-deleted tasks from queries
TaskSchema.pre(/^find/, function (next) {
    if (!this.getOptions().skipDeletedCheck) {
        this.setQuery({ ...this.getQuery(), isDeleted: false });
    }
    next();
});

// ✅ Prevent Soft Deleted Tasks from Updating
TaskSchema.pre("findOneAndUpdate", function (next) {
    this.setOptions({ runValidators: true });
    this.setQuery({ ...this.getQuery(), isDeleted: false });
    next();
});

module.exports = mongoose.model("Task", TaskSchema);
