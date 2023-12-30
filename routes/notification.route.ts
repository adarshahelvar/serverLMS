import express from "express";
import { getNotification } from "../controllers/notification.controller";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";

const notificationRouter = express.Router();

notificationRouter.get('/get-all-notification',isAuthenticated , authorizationRoles("admin") , getNotification);


export default notificationRouter;