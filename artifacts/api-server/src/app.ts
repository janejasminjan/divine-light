import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { authMiddleware } from "./middlewares/authMiddleware";
import { guestMiddleware } from "./middlewares/guestMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin: Parameters<typeof cors>[0]["origin"] =
  allowedOrigins.length > 0
    ? allowedOrigins
    : process.env.NODE_ENV === "development"
      ? true
      : false;

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: corsOrigin }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware: loads OIDC session into req.user if present
app.use(authMiddleware);
// Guest middleware: resolves/creates a guest user and sets req.resolvedUserId
app.use(guestMiddleware);

app.use("/api", router);

export default app;
