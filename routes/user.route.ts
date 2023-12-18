import express from "express";
import { activateUser, loginUser, logoutUser, registrationUser } from "../controllers/user.controller";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();
userRouter.post("/registration", registrationUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated,authorizationRoles("admin"), logoutUser);

export default userRouter;
