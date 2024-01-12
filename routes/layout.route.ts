import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { createLayout, editLayout, getLayoutByType } from "../controllers/layout.controller";

const layoutRouter = express.Router();

layoutRouter.post('/create-layout', isAuthenticated , authorizationRoles("admin") , createLayout);
layoutRouter.put('/edit-layout', isAuthenticated , authorizationRoles("admin") , editLayout);
layoutRouter.get('/get-layout/:type' , getLayoutByType);


export default layoutRouter;