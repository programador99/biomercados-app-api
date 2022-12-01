import express from "express";
import { getCategoriesPrincipal, getCategory } from "../services/category";
import { getUserAge } from "../services/users";
import { registerLogError } from "../middlewares/registerLog";

let router = express.Router();

router.get('/category/:id', async (req, res) => {
  try {

    const categoryId = req.params.id;

    const age = await getUserAge(req).catch(e => {
    });
    let isAdult = false;
    if (age) {
     isAdult = age >= 18;  
    }

    if (isNaN(parseInt(categoryId))) {
      throw { code: 400, message: "El id de la categoria debe ser numerico" }
    }

    const category = await getCategory(categoryId, isAdult).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });

    res.status(200).json(category)
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

router.get('/categoriesPrincipal', async (req, res) => {

  try {
    const age = await getUserAge(req).catch(e => {
    });
    let isAdult = false;
    if (age) {
     isAdult = age >= 18;  
    }

    let categories = await getCategoriesPrincipal(isAdult).catch(e => {
      throw { code: 400, message : "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente"}
    });

    res.status(200).json(categories)

  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
})

module.exports = router;
