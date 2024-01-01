import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { createLayout } from "../controllers/layout.controller";

const layoutRouter = express.Router();

layoutRouter.get('/create-layout',isAuthenticated , authorizationRoles("admin") , createLayout);


export default layoutRouter;