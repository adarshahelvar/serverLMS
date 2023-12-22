import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { uploadCourse } from "../controllers/course.controller";
const courseRouter = express.Router();

courseRouter.post('/createCourse',isAuthenticated, authorizationRoles("admin"), uploadCourse);

export default courseRouter;