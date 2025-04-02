const mongoose = require("mongoose");

const ArchivedTaskSchema = new mongoose.Schema(
    {
        originalTaskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["Archived"],
            default: "Archived",
        },
        completedAt: {
            type: Date,
            required: true,
        },
        createdAt: {
            type: Date,
            required: true,
        },
        updatedAt: {
            type: Date, // ✅ Added to track last modification before archiving
            required: true,
        },
        archivedAt: {
            type: Date,
            default: Date.now, // ✅ Timestamp when archived
        },
    },
    { timestamps: true }
);

// ✅ Indexing for better query performance
ArchivedTaskSchema.index({ project: 1, assignedTo: 1 });
ArchivedTaskSchema.index({ completedAt: 1 });

module.exports = mongoose.model("ArchivedTask", ArchivedTaskSchema);
