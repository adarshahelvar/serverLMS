import express from "express";
import { getNotification, updateNotification } from "../controllers/notification.controller";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";

const notificationRouter = express.Router();

notificationRouter.get('/get-all-notification' , isAuthenticated , authorizationRoles("admin") , getNotification);
notificationRouter.put('/update-notification/:id', isAuthenticated , authorizationRoles("admin") , updateNotification);


export default notificationRouter;