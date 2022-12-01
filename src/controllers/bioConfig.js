import express from "express";
import { registerLogError } from "../middlewares/registerLog";
import { createdBanks, getBanks, updateCategories, getCategory, getZipCodes } from "../services/bioConfig";

let router = express.Router();

router.get('/banks', async (req, res) => {
  try {
    const response = await getBanks().catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message)
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.post('/banks', async (req, res) => {
  try {
    const banks = req.body;
    const response = await createdBanks(banks).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message)
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/category', async (req, res) => {
  try {
    const response = await getCategory().catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message)
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.post('/category', async (req, res) => {
  try {
    const categories = await updateCategories(req.body).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(categories);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message)
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/zip_codes', async (req, res) => {
  try {
    const zipCodes = await getZipCodes().catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(zipCodes);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message)
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.post('/zip_codes', async (req, res) => {
  try {
    const zipCodes = await insertZipCodes(req.body).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(zipCodes);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message)
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

export default router;
