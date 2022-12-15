import express from "express";
import { getBanners, getCMSBlock, getCountries, getCountry, getFrequentQuestions, getLegalId, getStockStatuses, getStores, getTax, getZipCodes } from "../services/store";

import { registerLogInfo, registerLogError } from "../middlewares/registerLog";

let router = express.Router();

router.get('/store', async (req, res) => {
  let response = ''
  try {
    response = await getStores().catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/getStock', async (req, res) => {
  let response = '';
  try {
    const { storeView, sku } = req.query;

    if(!storeView) {
      throw { code: 400, message: "El storeView es requerido" }
    }

    if(!sku) {
      throw { code: 400, message: "El sku del producto es requerido" }
    }

    response = await getStockStatuses(storeView, sku).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/getCountries', async (req, res) => {
  try {
    const response = await getCountries().catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/getCountry', async (req, res) => {
  try {
    const { countryId } = req.query;

    if(!countryId) {
      throw { code: 400, message: "El countryId es requerido" }
    }
    const response = await getCountry(countryId).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/getZipcodes', async (req, res) => {
  try {
    const { region_id } = req.query;

    if(!region_id) {
      throw { code: 400, message: "El region_id es requerido como query param" }
    }
    
    const listZipCodes = await getZipCodes(region_id).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });

    res.status(200).json(listZipCodes);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/getTax', async (req, res) => {
  try {
    const response = await getTax().catch(e => {
      throw { code: 400, message : e.message}
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/getBanners', async (req, res) => {
  try {
    let idCmsBlock = 51;
    let sliders = await getBanners(idCmsBlock).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
    });
    res.status(200).json(sliders);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/legal', async (req, res) => {
  try {
    let { legalKey } = req.query;
    if (!legalKey) {
      throw { code: 400, message: "El legalKey es requerido" }
    }
    const { id } = await getLegalId(legalKey);
    const content = await getCMSBlock(id).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
    });
    res.status(200).json(content);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/getFrequentQuestions', async (req, res) => {
  try {
    const frequentQuestions = await getFrequentQuestions().catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(frequentQuestions);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

module.exports = router;