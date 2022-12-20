import express from "express";
import { getfilters } from "../services/filters";
import { autocompleteProductNameSearch, formatProduct, getProductBySku, getProducts, getProductsMoreSeller, getRelatedProducts, getBioinsuperables } from "../services/product";
import { getMoreSearch, getUserAge } from "../services/users";

import { registerLogError } from "../middlewares/registerLog";

let router = express.Router();

router.get('/searchengine', async (req, res) => {
  try {

    const { search } = req.query;

    const age = await getUserAge(req).catch(e => {
    });
    let isAdult = false;
    if (age) {
      isAdult = age >= 18;
    }

    if (!search) {
      res.status(200).json([]);
    } else {

      const results = await autocompleteProductNameSearch(search, isAdult).catch(e => {
        throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      });
      res.status(200).json(results);
    }
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

router.get('/more-search', async (req, res) => {
  try {
    const search = await getMoreSearch().catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });

    res.status(200).json(search);

  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);;
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
})

router.get('/filters', async (req, res) => {
  try {

    const filters = await getfilters().catch(e => {
      throw { code: e.response.status, message: e.response.data.message }
    });

    res.status(200).json(filters);
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

router.get("/products-more-seller", async (req, res) => {
  try {

    let { page, size, storeId } = req.query;

    if (!page) {
      page = 0;
    }

    if (!size) {
      size = 20;
    }

    const age = await getUserAge(req).catch(e => {
    });
    let isAdult = (age && age >= 18) ?? false;
    // if (age) {
    //  isAdult = age >= 18;
    // }

    // const { storeId } = req.query;

    if (!storeId) {
      throw { code: 400, message: "Debe mandar el storeId como query param" }
    }

    let products = await getProductsMoreSeller(storeId, isAdult, page, size).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });

    res.status(200).json(products);
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

router.get("/getRelatedProduct", async (req, res) => {
  try {

    const { sku } = req.query;

    const age = await getUserAge(req).catch(e => {
    });
    let isAdult = false;
    if (age) {
      isAdult = age >= 18;
    }
    /** atento aqui  creo que este no se va a usar*/

    const response = await getRelatedProducts(sku).catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
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

router.get('/get-products/:storeId/:userId/', async (req, res) => {
  try {
    const { storeId, userId } = req.params;

    const age = await getUserAge(req).catch(e => {
    });
    let isAdult = false;
    if (age) {
      isAdult = age >= 18;
    }

    if (userId !== 'null' && userId && isNaN(parseInt(userId))) {
      throw { code: 400, message: "El id del usuario debe ser numerico" }
    }

    if (isNaN(parseInt(storeId))) {
      throw { code: 400, message: "El id de la tienda debe ser numerico" }
    }

    const products = await getProducts(req.query, storeId, userId, isAdult).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(products);
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

router.get('/get-bioinsuperables/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    const age = await getUserAge(req).catch(e => {
    });
    let isAdult = false;
    if (age) {
      isAdult = age >= 18;
    }

    if (isNaN(parseInt(storeId))) {
      throw { code: 400, message: "El id de la tienda debe ser numerico" }
    }

    const products = await getBioinsuperables(storeId, isAdult).catch(e => {
      console.log(e);
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(products);
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

router.get('/product-detail', async (req, res) => {
  try {

    const { sku, storeId } = req.query;

    if (!sku && isNaN(parseInt(sku))) {
      throw { code: 400, message: "El sku del producto es requerido y debe ser numerico" }
    }

    if (isNaN(parseInt(storeId))) {
      throw { code: 400, message: "El id de la tienda debe ser numerico" }
    }

    const product = await getProductBySku(sku).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });

    const response = formatProduct(product, storeId);
    res.status(200).json(response[0]);

  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
})


module.exports = router;
