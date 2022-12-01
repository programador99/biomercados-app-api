import express from "express";
import { addCustomerAddress, applyCoupon, getCartId, getCustomerAddress, getCustomerCart, getHistorySearch, getOrder, getOrders, getUser, repeatOrder, synchronizeShoppingCart, updateCustomerProfiler, getUserForId } from '../services/users';
import { registerLogInfo, registerLogError } from "../middlewares/registerLog";

let router = express.Router();

router.get('/history-search', async (req, res) => {
  try {
    const { userId } = req.query;

    if (userId && isNaN(parseInt(userId))) {
      throw { code: 400, message: "El id del usuario (userId) debe ser numerico" }
    }

    const history = await getHistorySearch(userId).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });

    res.status(200).json(history);

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

router.get('/my-profile', async (req, res) => {
  try {

    const { email } = req.query;
    if (!email) {
      throw { code: 400, message: "El email del usuario es requerido" }
    }

    const response = await getUser(email).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
    });

    if (!response) {
      throw { code: 404, message: "El email no coincide con ningun usuario" }
    }

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

router.put('/updateProfiler', async (req, res) => {
  try {
    const { customerId } = req.query;
    if (customerId && isNaN(parseInt(customerId))) {
      throw { code: 400, message: "El id del usuario (customerId) debe ser numerico" }
    }

    const customerData = req.body;

    const response = await updateCustomerProfiler(customerId, customerData).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
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




router.get('/getCart', async (req, res) => {
  try {
    const { customer_id, store_view } = req.query;
    if (customer_id && isNaN(parseInt(customer_id))) {
      throw { code: 400, message: "El id del usuario (customer_id) debe ser numerico" }
    }

    if (!store_view) {
      throw { code: 400, message: "El store_view de la tienda es necesario" }
    }
    const cartId = await getCartId(customer_id, store_view).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
    });

    const response = await getCustomerCart(cartId, store_view).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
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

router.get('/getCartId', async (req, res) => {
  try {
    const { customer_id, store_view } = req.query;

    if (customer_id && isNaN(parseInt(customer_id))) {
      throw { code: 400, message: "El id del usuario (customer_id) debe ser numerico" }
    }

    if (!store_view) {
      throw { code: 400, message: "El store_view de la tienda es requerido" }
    }

    const cartId = await getCartId(customer_id, store_view).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
    });

    res.status(200).json(cartId);
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


router.post('/synchronize-cart', async (req, res) => {
  try {
    const { cart_id, customerToken, view_store, items } = req.body;

    if (cart_id && isNaN(parseInt(cart_id))) {
      throw { code: 400, message: "El id del carrito (cart_id) debe ser numerico" }
    }

    if (!customerToken) {
      throw { code: 400, message: "El token del usuario (customerToken) es requerido" }
    }

    if (!view_store) {
      throw { code: 400, message: "El view_store de la tienda es requerido" }
    }

    if (!items) {
      throw { code: 400, message: "Los items del carrito son requeridos" }
    }

    const cart = await getCustomerCart(cart_id, view_store).catch(e => {
      throw { code: e.status, message : e.message, flag: true}
    });

    const cartSynchronized = await synchronizeShoppingCart(cart_id, customerToken, view_store, items, cart.items).catch(e => {
      throw { code: e.status, message : e.message}
    });

    res.status(200).json(cartSynchronized);
  } catch (error) {
    if (error && error.message) {
      console.error("Error", error);
      registerLogError(error.message)
      res.status(500).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
})

router.put('/applyCoupon', async (req, res) => {
  try {
    const { cart_id, coupon_code } = req.body;

    if (cart_id && isNaN(parseInt(cart_id))) {
      throw { code: 400, message: "El id del carrito (cart_id) debe ser numerico" }
    }

    if (!coupon_code) {
      throw { code: 400, message: "El codigo del cupon (coupon_code) es requerido" }
    }

    const response = await applyCoupon({ cart_id, coupon_code }).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
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


router.get('/getCustomerAddress', async (req, res) => {
  try {
    const { customer_id } = req.query;
    if (customer_id && isNaN(parseInt(customer_id))) {
      throw { code: 400, message: "El id del usuario (customer_id) debe ser numerico" }
    }

    const response = await getCustomerAddress(customer_id).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
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


router.put('/addCustomerAddress', async (req, res) => {
  try {
    const customerAddress = req.body;
    const response = await addCustomerAddress(customerAddress).catch(e => {
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

router.delete('/deleteCustomerAddress', async (req, res) => {
  try {
    const { address_id, customer_id } = req.query;

    if (address_id && isNaN(parseInt(address_id))) {
      throw { code: 400, message: "El id de la direccion debe ser numerico" }
    }

    if (customer_id && isNaN(parseInt(customer_id))) {
      throw { code: 400, message: "El id del usuario (customer_id) debe ser numerico" }
    }

    const  { addresses }  = await getUserForId(customer_id).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
    });

    if (addresses.length == 1) {
      throw { code: 400, message: "No puede borrar su direccion predeterminada" }
    }

    const addresSelected = addresses.find(address => address.id == address_id);
    let otherAddresses = addresses.filter(address => address.id != address_id);

    if (addresSelected.default_shipping) {
      otherAddresses[0].default_shipping = true;
    }

    if (addresSelected.default_billing) {
      otherAddresses[0].default_billing = true;
    }

    const customerAddress = {
      addresses : otherAddresses
    }

    const customer = await updateCustomerProfiler(customer_id, customerAddress).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
    });

    res.status(200).json(customer);
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

router.get('/getOrders', async (req, res) => {
  try {
    const { customer_id, page, size, date, amount } = req.query;

    if (customer_id && isNaN(parseInt(customer_id))) {
      throw { code: 400, message: "El id del usuario (customer_id) debe ser numerico" }
    }

    if (!page || page < 1) {
      throw { code: 400, message: "El debe enviar un page valido (mayor a 0) como query param" }
    }

    if (!size || size < 1) {
      throw { code: 400, message: "El debe enviar un size valido (mayor a 0) como query param" }
    }

    if (date && isNaN(parseInt(date)) || date < 1) {
      throw { code: 400, message: "La cantidad de meses a filtrar (date) debe ser numerico y mayor a 0" }
    }

    if (amount && isNaN(parseInt(amount)) || amount < 1) {
      throw { code: 400, message: "el monto (amount) debe ser numerico y mayor a 0" }
    }

     const response = await getOrders(customer_id,req.query).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
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

router.get('/getOrder', async (req, res) => {
  try {
    const { order_id } = req.query;
    if (order_id && isNaN(parseInt(order_id))) {
      throw { code: 400, message: "El id de la orden (order_id) de compra debe ser numerico" }
    }

    const response = await getOrder(order_id).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
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

router.put('/repeatOrder', async (req, res) => {
  try {
    const { store, order_id, customer_token } = req.body;
    if (order_id && isNaN(parseInt(order_id))) {
      throw { code: 400, message: "El id de la orden (order_id) de compra debe ser numerico" }
    }

    if (!store) {
      throw { code: 400, message: "El store_view de la tienda es requerido" }
    }

    if (!customer_token) {
      throw { code: 400, message: "El token de usuario (customer_token) es requerido" }
    }

    const response = await repeatOrder(store, order_id, customer_token).catch(e => {
      throw { code: e.response.status, message : e.response.data.message}
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



module.exports = router;
