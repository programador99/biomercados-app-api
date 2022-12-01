import UserSearch from '../models/historySearch'
import { httpDelete, httpGet, httpPost, httpPut } from './axios'
import { getProductBySku } from './product';
import { getStores } from './store';

import { registerLogInfo } from "../middlewares/registerLog";

export const getHistorySearch = async (userId) => {
  return await UserSearch.findOne({ userId });
}

export const createHistorySearch = async (userId) => {
  const historySearch = {
    userId,
    searches: [],
  }
  return await UserSearch.create(historySearch);
}

export const saveHistorySearch = async (userId, search) => {
  return await UserSearch.updateOne(
    { userId },
    {
      $push: {
        searches: {
          $each: [search],
          $position: 0,
          $slice: 10
        }
      }
    }
  )
};

export const getMoreSearch = async () => {
  const usersSearches = await UserSearch.find();
  let allSearches = [];

  for (const user of usersSearches) {

    const userSearches = user.searches;
    if (userSearches) {
      for (const userSearch of userSearches) {
        const isSave = allSearches.find(search => search.value == userSearch);
        if (isSave) {
          const indexSearchSave = allSearches.findIndex(search => search == isSave);
          allSearches[indexSearchSave].quantity++;
        } else {
          if (userSearch != null) {
            const saveSearch = {
              value: userSearch,
              quantity: 1
            }
            allSearches.push(saveSearch);
          }
        }
      }
    }
  }

  let sortedSearches = allSearches.sort((a, b) => {
    if (a.quantity < b.quantity) {
      return 1;
    } else {
      return -1;
    }
  });

  return sortedSearches.slice(0, 3).map(search => search.value);
}

export const getUser = async (email) => {
  const url = 'rest/all/V1/customers/search?searchCriteria[sortOrders][0][field]=email&searchCriteria[sortOrders][0][direction]=asc&searchCriteria[filter_groups][0][filters][0][field]=email&searchCriteria[filter_groups][0][filters][0][condition_type]=eq&searchCriteria[filter_groups][0][filters][0][value]=' + email;
  return (await httpGet(url))?.items[0];
};

export const getAuthUser = async (token) => {
  const url = 'rest/V1/customers/me';

  return (await httpGet(url, token));
};

export const getUserAge = async (req) => {
  const token = req.header('authorization') ? req.header('authorization').split(' ')[1] : null;
  const user = await getAuthUser(token);
  if (!user.dob) {
    return 0;
  }

  return getAge(user.dob);
}

const getAge = (dateString) => {
  let today = new Date();
  let birthdate = new Date(dateString);
  let age = today.getFullYear() - birthdate.getFullYear();
  let diffMonths = today.getMonth() - birthdate.getMonth();

  if (
    diffMonths < 0 ||
    (diffMonths === 0 && today.getDate() < birthdate.getDate())
  ) {
    age--;
  }

  return age;
}

export const getUserForId = async (id) => {
  const url = 'rest/V1/customers/' + id;
  return await httpGet(url);
};

export const getCartId = async (customerId, storeView) => {
  const url = `rest/${storeView}/V1/customers/${customerId}/carts`;
  return await httpPost(url);
};

export const getCustomerCart = async (cartId, store_view) => {
  const url = `rest/V1/carts/${cartId}?fields=id,updated_at,is_active,items,items_count,items_qty,billing_address[city,street],currency[base_currency_code],store_id,extension_attributes[shipping_assignments[shipping]]`;
  const cart = await httpGet(url);
  const itemsCart = [];
  let stores = await getStores();
  let storeCode = -1;

  for (const store of stores) {
    store.storeViews.forEach(storeView => {
      if (storeView.codde == store_view) {
        storeCode = storeView.id;
      }
    });
  }

  for await (let item of cart?.items) {
    let product = await getProductBySku(item?.sku);
    product = product[0];
    try {
      item.quantity = item.qty;
      delete item.qty;
      itemsCart.push({
        ...item,
        stock: product.stores.filter(store => store.id == storeCode)[0]?.stock ?? 0,
        image: product.image
      });
    } catch (error) {
      // Si el producti no existe en la base de datos mongo
      item.quantity = item.qty;
      delete item.qty;
      itemsCart.push({
        ...item,
        stock: 0,
        image: product?.image // Fix optional param
      });
    }
  }

  // Asignando listado de items modificados al carrito
  cart.items = itemsCart;

  return cart;
}

// Obtener Perfil por Id
export const getCustomerById = async (customerId) => {
  const url = '/rest/V1/customers/' + customerId;
  return await httpGet(url);
};


export const synchronizeShoppingCart = async (cart_id, customerToken, view_store, items, oldItems) => {

  for await (const product of items) {
    const productUpdate = {
      sku: product.sku,
      qty: product.quantity,
      cart_id,
      customerToken
    }

    if (!product.item_id) {
      /** si no existe el producto lo crea */
      await setItemToCart(productUpdate, view_store).catch(e => {
        console.log(product.name);
        console.log('setItemToCart', e.response.status, e.response.data.message);
        registerLogInfo(product.name + 'setItemToCart' + e.response.data.message);
        if (e.response.status == 401) {
          throw e;
        }
      });
    } else {
      /** de existir actualiza (sumar o restar unidades)  */


      const item = oldItems.find(oldItem => oldItem.item_id === product.item_id);

      /**validar que el item cambiara en cantidad */
      if (item && item?.quantity != product.quantity) {
        await updateItemToCart(productUpdate, view_store, product.item_id).catch(e => {
          console.log(product.name);
          console.log('updateItemToCart', e.response.status, e.response.data.message);
          registerLogInfo(product.name + 'updateItemToCart' + e.response.data.message);
          if (e.response.status == 401) {
            throw e;
          }
        });
      }


    }

  }

  /** luego borrar los productos que ya no esten en el carrito */
  for await (const productSave of oldItems) {

    const item = items.find(item => item?.item_id === productSave.item_id);
    if (!item) {

      await removeTotallyItemToCart(productSave.item_id, view_store, customerToken).catch(e => {
        if (e.response.status == 401) {
          throw e;
        }
      });

    }
  }


  return await getCustomerCart(cart_id, view_store);

}



export const setItemToCart = (params, view_store) => {
  const url = 'rest/' + view_store + '/V1/carts/mine/items';
  const { sku, qty, cart_id, customerToken } = params;
  const cartData = {
    cartItem: {
      sku: sku,
      qty: qty,
      quote_id: cart_id
    }
  };

  return httpPost(url, cartData, customerToken);
};


export const updateItemToCart = (params, view_store, item_id) => {
  const url = 'rest/' + view_store + '/V1/carts/mine/items/' + item_id;
  const { sku, qty, cart_id, customerToken } = params;
  const cartData = {
    cartItem: {
      sku: sku,
      qty: qty,
      quote_id: cart_id
    }
  };
  return httpPut(url, cartData, customerToken);
};

export const removeTotallyItemToCart = async (item_id, view_store, customerToken) => {
  const url = 'rest/' + view_store + '/V1/carts/mine/items/' + item_id;

  return await httpDelete(url, customerToken);
}

/**
 * Aplicar cupon de descuento
 */
export const applyCoupon = async ({ cart_id, coupon_code }) => {
  const url = `rest/V1/carts/${cart_id}/coupons/${coupon_code}`;
  return await httpPut(url, {})
};


export const updateCustomerProfiler = async (customerId, updatedCustomerData) => {
  const url = 'rest/V1/customers/' + customerId;
  const customer = await getCustomerById(customerId);
  return await httpPut(url, {
    customer: { ...customer, ...updatedCustomerData }
  });
}

/**
 * Direcciones de Clientes
 */
export const getCustomerAddress = async (customerId) => {
  const url = '/rest/V1/customers/' + customerId;
  const customer = await httpGet(url);

  if (customer) {
    return customer?.addresses;
  } else {
    return null;
  }
};

export const addCustomerAddress = async (customerAddress) => {
  const { customer_id, id } = customerAddress;
  const customer = await getCustomerById(customer_id);
  // Actualizando direcciones
  let addresses = customer.addresses;
  if (id) {
    addresses = addresses.filter(addressCustomer => addressCustomer.id != id);
    if (addresses.length == customer.addresses.length) {
      delete customerAddress.id;
    }
  }
  customer.addresses = [...addresses, customerAddress];

  customer.firstname = customer.firstname.toString().replace(/[&\/\\#,+()$~%.'":*?<>{}ã±]/g,'');
  customer.lastname = customer.lastname.toString().replace(/[&\/\\#,+()$~%.'":*?<>{}ã±]/g,'');

  const url = 'rest/V1/customers/' + customer_id;
  return await httpPut(url, { customer });
};


/**
 * Customer Attributes
 */
export const updateCutomerAttribrute = async (attributes) => {
  // const ``;
  // Pendiente por desarrollo a nivel de plantilla (diseno)
};


export const getOrders = async (customerId, params) => {

  const { status, sort, page, size, date, amount } = params;
  let queryStatus = '';
  if (status) {
    queryStatus = `&searchCriteria[filter_groups][2][filters][0][condition_type]=eq&searchCriteria[filter_groups][2][filters][0][field]=status&searchCriteria[filter_groups][2][filters][0][value]=${status}`
  }

  let querySort = `&searchCriteria[sortOrders][0][field]=created_at&searchCriteria[sortOrders][0][direction]=`;
  if (sort && (sort == 'DESC' || 'ASC')) {
    querySort = querySort + sort;
  } else {
    querySort = querySort + 'DESC';
  }

  const queryPagination = `&searchCriteria[page_size]=${size}&&searchCriteria[current_page]=${page}`;

  let queryDate = '';
  if (date) {
    queryDate = getQueryForTime(date);
  }

  let queryAmount = '';
  if (amount) {
    queryAmount = `&searchCriteria[filter_groups][3][filters][0][field]=base_grand_total&searchCriteria[filter_groups][3][filters][0][value]=${amount}&searchCriteria[filter_groups][3][filters][0][condition_type]=gt`
  }

  const url = `rest/all/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=customer_id&searchCriteria[filter_groups][0][filters][0][value]=${customerId}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq&fields=items[increment_id,created_at,status,extension_attributes[shipping_assignments[shipping[address[region,city,street,region_id,postcode]]]]],total_count` + queryPagination + querySort + queryStatus + queryDate + queryAmount;

  return await httpGet(url);
}

const getQueryForTime = (quantityMonths) => {
  const hoy = new Date();
  const month = 1000 * 60 * 60 * 24 * 30;
  const time = quantityMonths * month;
  const evaluateDay = new Date(hoy.getTime() - time);
  let date = '';
  for (const partStringDate of evaluateDay.toISOString().split("T")) {
    if (partStringDate.split(".").length == 1) {
      date = date + partStringDate;
    } else {
      date = date + ' ' + partStringDate.split(".")[0];
    }
  }

  const queryDate = `&searchCriteria[filter_groups][1][filters][0][field]=created_at&searchCriteria[filter_groups][1][filters][0][value]=${date}&searchCriteria[filter_groups][1][filters][0][condition_type]=gt`
  return queryDate;
}


/**
 * Obtener Orden por Id
 */
export const getOrder = async (orderId) => {
  const url = `rest/all/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=increment_id&searchCriteria[filter_groups][0][filters][0][value]=${orderId}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq&fields=items[customer_id,tax_amount,increment_id,order_currency_code,grand_total,billing_address[region,city,street,telephone],shipping_amount,shipping_description,created_at,customer_email,customer_taxvat,customer_firstname,customer_lastname,state,status,store_id,store_name,subtotal,base_subtotal,coupon_code,discount_amount,items[sku,name,weight,price,row_total,qty_ordered,tax_amount,tax_percent],extension_attributes[shipping_assignments[shipping],payment_additional_info],payment[method,amount_ordered,additional_information]]`;

  return await httpGet(url);
}


/**
 * Repetir Pedido
 */
export const repeatOrder = async (storeView, orderId, customerToken) => {
  const order = await getOrder(orderId);
  const { customer_id, items } = order?.items[0];
  const cartId = await getCartId(customer_id, storeView);
  const cartItems = [];

  // Recorrer todos los productos
  for await (const item of items) {
    try {
      const isAdded = await setItemToCart({
        sku: item.sku,
        qty: item.qty_ordered,
        cart_id: cartId,
        customerToken: customerToken
      });

      if (isAdded) {
        cartItems.push(item.sku);
      }
    } catch (notAvaliable) {
      if (notAvaliable)
        continue;
    }
  }

  return cartItems;
};
