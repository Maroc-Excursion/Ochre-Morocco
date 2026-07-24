import { Router, type IRouter } from "express";
    import healthRouter from "./health";
    import authRouter from "./auth";
    import servicesRouter from "./services";
    const router: IRouter = Router();
    router.use(healthRouter);
    router.use(authRouter);
    router.use(servicesRouter);
    export default router;
    