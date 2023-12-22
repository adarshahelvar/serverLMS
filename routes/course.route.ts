import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { editCourse, uploadCourse } from "../controllers/course.controller";
const courseRouter = express.Router();

courseRouter.post('/createCourse',isAuthenticated, authorizationRoles("admin"), uploadCourse);
courseRouter.put('/edit-course/:id',isAuthenticated, authorizationRoles("admin"), editCourse);

export default courseRouter;