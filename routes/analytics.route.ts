import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { getCoursesAnalytics, getUserAnalytics, getorderAnalytics } from "../controllers/analytics.controller";
import { updateAccessToken } from "../controllers/user.controller";
const analyticsRouter = express.Router();

analyticsRouter.get('/get-users-analytics',updateAccessToken, isAuthenticated,authorizationRoles("admin"), getUserAnalytics);
analyticsRouter.get('/get-courses-analytics',updateAccessToken, isAuthenticated,authorizationRoles("admin"), getCoursesAnalytics);
analyticsRouter.get('/get-order-analytics',updateAccessToken, isAuthenticated,authorizationRoles("admin"), getorderAnalytics);


export default analyticsRouter;