import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { getCoursesAnalytics, getUserAnalytics, getorderAnalytics } from "../controllers/analytics.controller";
const analyticsRouter = express.Router();

analyticsRouter.get('/get-users-analytics',isAuthenticated,authorizationRoles("admin"), getUserAnalytics);
analyticsRouter.get('/get-courses-analytics',isAuthenticated,authorizationRoles("admin"), getCoursesAnalytics);
analyticsRouter.get('/get-order-analytics',isAuthenticated,authorizationRoles("admin"), getorderAnalytics);


export default analyticsRouter;