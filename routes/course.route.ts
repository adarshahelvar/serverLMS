import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { addAnswer, addQuestion, addReplayReview, addReview, deleteCourse, editCourse, generateVideoUrl, getAllCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller";
import { updateAccessToken } from "../controllers/user.controller";
const courseRouter = express.Router();

// Why updateAccessToken is added,-> While creating course adding all data will take more than 20 min time but token expires in 5 min so for that we are updating updateAccessToken before sending data
courseRouter.post('/createCourse',updateAccessToken, isAuthenticated, authorizationRoles("admin"), uploadCourse);
courseRouter.put('/edit-course/:id',updateAccessToken, isAuthenticated, authorizationRoles("admin"), editCourse);
courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/get-all-courses', getAllCourse);
courseRouter.get('/get-course-content/:id',updateAccessToken, isAuthenticated, getCourseByUser);
courseRouter.put('/add-question',updateAccessToken, isAuthenticated, addQuestion);
courseRouter.put('/add-answer',updateAccessToken, isAuthenticated, addAnswer);
courseRouter.put('/add-review/:id',updateAccessToken, isAuthenticated, addReview);
courseRouter.put('/add-reply',updateAccessToken, isAuthenticated,authorizationRoles("admin"), addReplayReview);
courseRouter.get('/get-courses',updateAccessToken, isAuthenticated,authorizationRoles("admin"), getAllCourses);
courseRouter.post('/getVdoCipherOTP', generateVideoUrl);
courseRouter.delete("/delete-course/:id",updateAccessToken, isAuthenticated,authorizationRoles("admin"), deleteCourse);



export default courseRouter;