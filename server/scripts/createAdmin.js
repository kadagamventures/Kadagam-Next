require("dotenv").config(); // Load environment variables
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/dbConfig"); // Ensure correct path

const ADMIN_ID = "8000"; // 🔥 Fixed Admin ID

const createAdmin = async () => {
  try {
    // ❗ Prevent running in production for safety
    if (process.env.NODE_ENV === "production") {
      console.error("⚠️ Cannot run this script in production environment!");
      return;
    }

    console.log("🔗 Connecting to MongoDB...");
    await connectDB();

    // 🔍 Check if admin already exists by email or staffId
    const existingAdmin = await User.findOne({
      $or: [{ email: process.env.ADMIN_EMAIL }, { staffId: ADMIN_ID }],
      isDeleted: false, // Ensures checking only active admins
    });

    console.log("🔐 Hashing admin password...");
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

    // ✅ Admin Data with Full Permissions
    const adminData = {
      name: "Admin",
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      isActive: true, // Ensure admin is active
      isDeleted: false, // Prevent soft-delete issues
      permissions: ["manage_staff", "manage_project", "manage_task"], // Full permissions
      staffId: ADMIN_ID,
    };

    // 🧐 Check and Update Admin if Already Exists
    if (existingAdmin) {
      console.log("⚠️ Admin already exists. Updating any missing fields...");
      await User.updateOne({ staffId: ADMIN_ID }, { $set: adminData });
      console.log("✅ Admin updated successfully.");
    } else {
      console.log("👤 Creating new admin user...");
      await User.create(adminData);
      console.log("✅ New admin created successfully.");
    }
  } catch (error) {
    console.error("❌ Error creating/updating admin:", error.message);
  } finally {``
    console.log("🔌 Closing MongoDB connection...");
    await mongoose.connection.close();
  }
};

createAdmin();
