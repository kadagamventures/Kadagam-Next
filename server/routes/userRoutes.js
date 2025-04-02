const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const checkPermissions = require("../middlewares/permissionsMiddleware");

const { getUserProfile, getMyProfile } = require("../controllers/userController");

const { getAssignedProjects } = require("../controllers/projectController");

// ✅ Protect All User Routes
router.use(verifyToken);

/**  
 * 🏢 **User Profile Management**
 * - ✅ Staff can ONLY view their own profile.
 * - ✅ Admins can view any profile.
 */
router.get("/profile", (req, res, next) => {
    req.params.id = req.user.id; // Staff can only fetch their own profile
    next();
}, getUserProfile);

/**  
 * 📂 **Assigned Projects & Tasks**
 * - ✅ Staff can view their assigned projects.
 * - ✅ Staff with `manage_project` permission can access all.
 */
router.get("/projects/assigned", checkPermissions("manage_project"), getAssignedProjects);

router.get("/my-profile", getMyProfile);


module.exports = router;
