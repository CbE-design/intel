import { Router, type IRouter } from "express";
import healthRouter from "./health";
import intelligenceRouter from "./intelligence";
import cyberRouter from "./cyber-intel";
import subjectsRouter from "./subjects";
import researchReportsRouter from "./research-reports";
import extendedIntelRouter from "./extended-intel";
import analystRouter from "./analyst";
import phoneRouter from "./phone";

const router: IRouter = Router();

router.use(healthRouter);
router.use(intelligenceRouter);
router.use(cyberRouter);
router.use(subjectsRouter);
router.use(researchReportsRouter);
router.use(extendedIntelRouter);
router.use(analystRouter);
router.use(phoneRouter);

export default router;
