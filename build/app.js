"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const error_1 = require("./middleware/error");
const user_route_1 = __importDefault(require("./routes/user.route"));
const course_route_1 = __importDefault(require("./routes/course.route"));
const order_route_1 = __importDefault(require("./routes/order.route"));
const notification_route_1 = __importDefault(require("./routes/notification.route"));
const analytics_route_1 = __importDefault(require("./routes/analytics.route"));
const layout_route_1 = __importDefault(require("./routes/layout.route"));
const express_rate_limit_1 = require("express-rate-limit");
dotenv_1.default.config();
exports.app = (0, express_1.default)();
// body parser with increased limit
exports.app.use(express_1.default.json());
// app.use(express.json({ limit: "50mb" }));
// cookie parser
exports.app.use((0, cookie_parser_1.default)());
// Cors => cross-origin resource sharing
// app.use(
//   cors({
//     origin: process.env.ORIGIN,
//   })
// );
exports.app.use((0, cors_1.default)({
    origin: ['http://localhost:3000'],
    credentials: true,
}));
// Rate limit for limited API requests
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});
// Routing
exports.app.use("/api/v1", user_route_1.default);
exports.app.use("/api/v1", course_route_1.default);
exports.app.use("/api/v1", order_route_1.default);
exports.app.use("/api/v1", notification_route_1.default);
exports.app.use("/api/v1", analytics_route_1.default);
exports.app.use("/api/v1", layout_route_1.default);
// app.post("/api/v1/activate-user", (req, res) => {
//   console.log("Request Headers:", req.headers);
//   console.log("Request Body:", req.body);
// });
// Testing api
exports.app.get("/", (req, res, next) => {
    res.status(200).json({ message: `API is working...!` });
});
// Unknown Route
exports.app.all("*", (req, res, next) => {
    const err = new Error(`Invalid route ${req.originalUrl} not found`);
    err.status = 404;
    next(err);
    // res.status(404).json({ message: `Invalid route ${req.originalUrl} not found` });
    /* In above two error use any one, Both serve same purpose*/
});
// Apply the rate limiting middleware to all requests.
exports.app.use(limiter);
exports.app.use(error_1.ErrorMiddleware);
