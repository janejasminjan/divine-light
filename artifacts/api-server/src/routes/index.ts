import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import memorizationRouter from "./memorization";
import progressRouter from "./progress";
import activityRouter from "./activity";
import bookmarksRouter from "./bookmarks";
import hadithProxyRouter from "./hadith-proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(memorizationRouter);
router.use(progressRouter);
router.use(activityRouter);
router.use(bookmarksRouter);
router.use(hadithProxyRouter);

export default router;
