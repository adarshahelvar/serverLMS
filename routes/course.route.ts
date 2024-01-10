import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { addAnswer, addQuestion, addReplayReview, addReview, deleteCourse, editCourse, generateVideoUrl, getAllCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller";
const courseRouter = express.Router();

courseRouter.post('/createCourse',isAuthenticated, authorizationRoles("admin"), uploadCourse);
courseRouter.put('/edit-course/:id',isAuthenticated, authorizationRoles("admin"), editCourse);
courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/get-all-courses', getAllCourse);
courseRouter.get('/get-course-content/:id',isAuthenticated, getCourseByUser);
courseRouter.put('/add-question',isAuthenticated, addQuestion);
courseRouter.put('/add-answer',isAuthenticated, addAnswer);
courseRouter.put('/add-review/:id',isAuthenticated, addReview);
courseRouter.put('/add-reply',isAuthenticated,authorizationRoles("admin"), addReplayReview);
courseRouter.get('/get-courses',isAuthenticated,authorizationRoles("admin"), getAllCourses);
courseRouter.post('/getVdoCipherOTP',isAuthenticated, generateVideoUrl);
// courseRouter.post('/getVdoCipherOTP', generateVideoUrl);
courseRouter.delete("/delete-course/:id",isAuthenticated,authorizationRoles("admin"), deleteCourse);



export default courseRouter;