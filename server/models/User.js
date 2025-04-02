const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true, // ✅ Indexed for fast queries
            match: [/^\S+@\S+\.\S+$/, "Invalid email format!"], // ✅ Email validation
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        role: {
            type: String,
            trim: true,
            default: "staff" // ✅ Default role if not provided
        },
        permissions: {
            type: [String], // ✅ Dynamic permissions array
            default: []     // No permissions assigned by default
        },
        staffId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true // ✅ Indexed for better query performance
        },
        salary: {
            type: Number,
            default: 0
        },
        phone: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^[0-9]{10,15}$/.test(v); // ✅ Ensures a valid phone number format
                },
                message: props => `${props.value} is not a valid phone number!`
            }
        },
        team: {
            type: String,
            default: ""  // Example: "HR Team", "Dev Team"
        },
        assignedProjects: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Project" // ✅ Reference to Project Model
            }
        ],
        profilePic: {
            type: String,
            default: ""  // ✅ Default empty string for consistency
        },
        resume: {
            type: String,
            default: ""  // ✅ Default empty string for consistency
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true  // ✅ Indexed for faster queries
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.password; // ✅ Prevents password exposure in API responses
                return ret;
            }
        }
    }
);

// ✅ Add text indexes for name and email for search functionality
userSchema.index({ name: "text", email: "text" });

const User = mongoose.model("User", userSchema);

module.exports = User;
