const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    staffId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true, 
        index: true // ✅ Faster lookups for user notifications
    },
    message: { 
        type: String, 
        required: true, 
        maxlength: 500 // ✅ Prevents excessively long messages
    },
    isRead: { 
        type: Boolean, 
        default: false // ✅ Tracks if the notification was opened
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    },
    expiresAt: { 
        type: Date,
        default: function () {
            // ✅ Auto-delete in 3 days if it's a Task Update, 7 days otherwise
            return /Task Update:/.test(this.message) 
                ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) 
                : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
    }
}, { timestamps: true });

/**
 * ✅ Index for auto-deletion
 * If notification is read, delete at midnight.
 * If unread:
 * - Task Updates delete after 3 days
 * - Other notifications delete after 7 days
 */
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);
