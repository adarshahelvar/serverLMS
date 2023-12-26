import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { editCourse, getAllCourse, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller";
const courseRouter = express.Router();

courseRouter.post('/createCourse',isAuthenticated, authorizationRoles("admin"), uploadCourse);
courseRouter.put('/edit-course/:id',isAuthenticated, authorizationRoles("admin"), editCourse);
courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/get-all-courses', getAllCourse);
courseRouter.get('/get-course-content/:id',isAuthenticated, getCourseByUser);


export default courseRouter;