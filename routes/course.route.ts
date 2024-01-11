import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { addAnswer, addQuestion, addReplayReview, addReview, deleteCourse, editCourse, generateVideoUrl, getAdminAllCourses, getAllCourse, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller";
const courseRouter = express.Router();

// Why updateAccessToken is added,-> While creating course adding all data will take more than 20 min time but token expires in 5 min so for that we are updating updateAccessToken before sending data
courseRouter.post('/createCourse', isAuthenticated, authorizationRoles("admin"), uploadCourse);
courseRouter.put('/edit-course/:id', isAuthenticated, authorizationRoles("admin"), editCourse);
courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/get-all-courses', getAllCourse);
courseRouter.get('/get-course-content/:id', isAuthenticated, getCourseByUser);
courseRouter.put('/add-question', isAuthenticated, addQuestion);
courseRouter.put('/add-answer', isAuthenticated, addAnswer);
courseRouter.put('/add-review/:id', isAuthenticated, addReview);
courseRouter.put('/add-reply', isAuthenticated,authorizationRoles("admin"), addReplayReview);
// courseRouter.get('/get-courses', isAuthenticated,authorizationRoles("admin"), getAdminAllCourses);
courseRouter.get('/get-admin-courses', isAuthenticated,authorizationRoles("admin"), getAdminAllCourses);

courseRouter.post('/getVdoCipherOTP', generateVideoUrl);
courseRouter.delete("/delete-course/:id", isAuthenticated,authorizationRoles("admin"), deleteCourse);



export default courseRouter;