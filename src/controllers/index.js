import express from "express";
import generalRouter from "./general"
import usersRouter from "./users"
import auhtRouter from "./auth"
import categoryRouter from "./category"
import productRouter from "./product"
import storeRouter from "./store"
import paymentRouter from "./payment";
import gateWays from "./payment_gateways/gateways";
import bioConfig from "./bioConfig";
import notificationsRouter from "./notifications";

function createRouter(app) {
  app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "X-Requested-With")
    next();
  });
  const router = express.Router();
  app.use('/api/v1', router);
  router.use('/', generalRouter);
  router.use('/users', usersRouter);
  router.use('/auth', auhtRouter);
  router.use('/categories', categoryRouter);
  router.use('/products', productRouter);
  router.use('/stores', storeRouter);
  router.use('/payment', paymentRouter);
  router.use('/gateway', gateWays);
  router.use('/bio-config', bioConfig);
  router.use('/notifications', notificationsRouter);
}


module.exports = createRouter;
