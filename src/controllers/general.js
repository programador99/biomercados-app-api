import express from "express";
import { getUser } from '../services/users'
import { getStores, getStockStatuses, getParentCategories, getChildrenCategory } from '../services/store'
let router = express.Router();


/* GET home page. */
router.get('/', (req, res, next) => {
  res.json('Hola el path correcto es /api/v1');
});

module.exports = router;
