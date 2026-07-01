import { Router, type IRouter } from "express";
import healthRouter from "./health";
import intelligenceRouter from "./intelligence";
import cyberRouter from "./cyber-intel";

const router: IRouter = Router();

router.use(healthRouter);
router.use(intelligenceRouter);
router.use(cyberRouter);

export default router;
