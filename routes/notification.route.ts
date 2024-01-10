import express from "express";
import { getNotification, updateNotification } from "../controllers/notification.controller";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";

const notificationRouter = express.Router();

notificationRouter.get('/get-all-notification', updateAccessToken , isAuthenticated , authorizationRoles("admin") , getNotification);
notificationRouter.put('/update-notification/:id',updateAccessToken, isAuthenticated , authorizationRoles("admin") , updateNotification);


export default notificationRouter;