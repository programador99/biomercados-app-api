import { httpGet, httpPost } from "./axios"
import { getCustomerById } from "./users"

const { MEGASOFT_URI, MEGASOFT_USER, MEGASOFT_PASS, MEGASOFT_C2P_AFFILIATECODE } = process.env;
const buff = Buffer.from(`${MEGASOFT_USER}:${MEGASOFT_PASS}`, 'utf-8');
const auth = buff.toString('base64');


export const getShippingMethod = async (cartId) => {
    const url = 'rest/V1/carts/' + cartId + '/shipping-methods';
    return await httpGet(url);
}

export const getShippingMethodByAddressId = async (params) => {
    const { customer_token, addressId, cartId, storeView } = params;
    const url = `rest/${storeView ?? ''}/V1/carts/mine/estimate-shipping-methods-by-address-id`;
    const payload = { addressId };
    cartId && Object.assign(payload, { cart_id: cartId });
    const result = cartId ? await httpPost(url, payload) : await httpPost(url, payload, customer_token);
    return result;
}

export const getPaymentMethod = async (cartId) => {
    const url = 'rest/V1/carts/' + cartId + '/payment-methods';
    return await httpGet(url);
}

export const getPaymentInformation = async (customer_token) => {
    const url = 'rest/V1/carts/mine/payment-information';
    return await httpGet(url, customer_token);
}

export const customerShippingMethods = async (params) => {
    const { store_view, customer_id, customer_token, billing_address_id, cart_id } = params;
    const customer = await getCustomerById(customer_id);

    if (customer) {
        const customerAddress = customer.addresses.find(address => address.id == billing_address_id);

        if (customerAddress) {
            const payload = {
                cart_id: cart_id,
                address: {
                    region: customerAddress.region.region,
                    region_id: customerAddress.region.region_id,
                    region_code: customerAddress.region.region_code,
                    country_id: customerAddress.country_id,
                    street: customerAddress.street,
                    postcode: customerAddress.postcode,
                    city: customerAddress.city,
                    firstname: customerAddress.firstname,
                    lastname: customerAddress.lastname,
                    email: customer.email,
                    telephone: customerAddress.telephone,
                    same_as_billing: 1
                }
            };

            const shippingMethods = await httpPost(`rest/${store_view}/V1/carts/mine/estimate-shipping-methods`, payload, customer_token);
            return shippingMethods;
        }

        return null;
    }
};

export const getShippingInformation = async (params) => {
    const { store_view, customer_id, customer_token, billing_address_id, shipping_address_id, shipping_carrier_code, shipping_method_code } = params;

    const customer = await getCustomerById(customer_id);

    if (customer) {
        const billingAddress = customer.addresses.find(address => address.id == billing_address_id);
        const shippingAddress = customer.addresses.find(address => address.id == shipping_address_id);

        if (billingAddress && shippingAddress) {
            const payload = {
                address_information: {
                    shipping_address: {
                        region: shippingAddress.region.region,
                        region_id: shippingAddress.region.region_id,
                        region_code: shippingAddress.region.region_code,
                        country_id: shippingAddress.country_id,
                        street: shippingAddress.street,
                        postcode: shippingAddress.postcode,
                        city: shippingAddress.city,
                        firstname: shippingAddress.firstname,
                        lastname: shippingAddress.lastname,
                        email: customer.email,
                        telephone: shippingAddress.telephone
                    },
                    billing_address: {
                        region: billingAddress.region.region,
                        region_id: billingAddress.region.region_id,
                        region_code: billingAddress.region.region_code,
                        country_id: billingAddress.country_id,
                        street: billingAddress.street,
                        postcode: billingAddress.postcode,
                        city: billingAddress.city,
                        firstname: billingAddress.firstname,
                        lastname: billingAddress.lastname,
                        email: customer.email,
                        telephone: billingAddress.telephone
                    },
                    shipping_carrier_code,
                    shipping_method_code
                }
            };

            // console.info(payload)

            const shippingInformation = await httpPost(`rest/${store_view}/V1/carts/mine/shipping-information`, payload, customer_token);
            return shippingInformation;
        }

        return null;
    }
};

const getOrderById = async (orderId) => {
    const url = `/rest/V1/orders/${orderId}`;
    return await httpGet(url);
};

export const customerCreateOrder = async (params) => {
    try {
        const { store_view, customer_id, customer_token, shipping_address_id, payment_method } = params;
        const customer = await getCustomerById(customer_id);

        if (customer) {

            const billingAddress = customer.addresses.find(address => address.id == shipping_address_id);

            if (billingAddress) {

                // Validacion de tipo de pago
                const { method, additional_data } = payment_method;

                let approvedTransaction = method === 'c2p_megasoft' ? false : true;
                let messageTransaction = '';

                if (method == 'c2p_megasoft' && additional_data) {
                    // console.info("Procesando pago");
                    const responseControl = await createControlC2P().catch( () => {
                        throw "Servicio no disponible temporalmente, por favor intente mas tarde.";
                    });
                    // console.info("control", responseControl)
                    const statusPayment = await verifyC2P(responseControl?.control);
                    // console.info("statusPayment", statusPayment)
                    if (statusPayment?.codigo === '09' && statusPayment?.estado === 'P') {
                        const payment = await processPaymentC2P({
                            ...additional_data, control: responseControl?.control
                        });

                        // console.info("payment", payment)

                        if (payment?.codigo === '00' && payment?.descripcion === 'APROBADA') {
                            approvedTransaction = true;
                        } else if (payment?.codigo === '51') {
                            throw "Saldo insuficiente";
                        } else if (payment?.codigo === '99') {
                            throw "Transaccion fallida.";
                        } else if (payment?.codigo === 'PC') {
                            throw "El numero de referencia ya fue utilizado en otro pago.";
                        } else if (payment?.codigo === 'PB') {
                            throw "Los datos suministrados no coinciden";
                        } else if (payment?.codigo === 'VS') {
                            throw "En este momento no podemos procesar su transaccion, por favor intenta mas tarde.";
                        }
                    }
                }

                const payload = {
                    paymentMethod: payment_method,
                    billing_address: {
                        email: customer.email,
                        region: billingAddress.region.region,
                        region_id: billingAddress.region_id,
                        region_code: billingAddress.region.region_code,
                        country_id: billingAddress.country_id,
                        street: billingAddress.street,
                        postcode: billingAddress.postcode,
                        city: billingAddress.city,
                        telephone: billingAddress.telephone,
                        firstname: billingAddress.firstname,
                        lastname: billingAddress.lastname
                    }
                };

                if (approvedTransaction) {
                    const orderInformation = await httpPost(`rest/${store_view}/V1/carts/mine/payment-information`, payload, customer_token);
                    const order = await getOrderById(orderInformation);

                    return { order_id: order.increment_id };
                } else {
                    throw "La transaccion no ha sido aprobada.";
                }
            }
        }
    } catch (error) {
        throw error;
    }
};

/**
 * 
 * Parse ?XML
 */
const parseResponse = (xmlString, columns, parentTag) => {
    const values = xmlString.split(parentTag + '>')[1].slice(2, -3).split('\n').toString().replace(/[(<a-z|_/>\s)]/g, '').split(',');
    let obj = {};

    columns.forEach((value, index) => {
        obj[value] = values[index];
    });

    return obj;
};

/**
 * Crear Pre-Registro C2P MegaSoft
 */
const createControlC2P = async () => {
    const payload = `
     <request>
        <cod_afiliacion>${MEGASOFT_C2P_AFFILIATECODE}</cod_afiliacion>
     </request>
    `;

    const responseXml = await httpPost('/payment/action/v2-preregistro', payload.trim(), auth, MEGASOFT_URI, true, {
        "Content-Type": 'text/xml'
    });
    const responseJson = parseResponse(responseXml, ['codigo', 'descripcion', 'control'], 'response');
    return responseJson;
}

/**
 * Verificando C2P MegaSoft
 */
const verifyC2P = async (control) => {
    const payload = `
    <request>
        <cod_afiliacion>${MEGASOFT_C2P_AFFILIATECODE}</cod_afiliacion>
        <control>${control}</control>
        <version>3</version>
        <tipotrx>C2P</tipotrx>
    </request>
    `;

    const responseXml = await httpPost('/payment/action/v2-querystatus', payload.trim(), auth, MEGASOFT_URI, true, {
        "Content-Type": 'text/xml'
    });
    const responseJson = parseResponse(responseXml, ['control', 'cod_afiliacion', 'factura', 'monto', 'estado', 'codigo', 'descripcion', 'vtid', 'seqnum', 'authid', 'authname', 'tarjeta', 'referencia', 'terminal', 'lote', 'rifbanco', 'afiliacion', 'voucher'], 'response');
    // console.info(responseJson);
    return responseJson;
};

/**
 * Procesar Pago C2P
 */
const processPaymentC2P = async (data) => {
    const { amount, cid, codigobanco, codigoc2p, telefono, factura, control } = data;
    const payload = `
    <request>
        <cod_afiliacion>${MEGASOFT_C2P_AFFILIATECODE}</cod_afiliacion>
        <control>${control}</control>
        <cid>${cid}</cid>
        <telefono>${telefono}</telefono>
        <codigobanco>${codigobanco}</codigobanco>
        <codigoc2p>${codigoc2p}</codigoc2p>
        <amount>${amount}</amount>
        <factura>${factura}</factura>
    </request>
    `;

    const responseXml = await httpPost('/payment/action/v2-procesar-compra-c2p', payload.trim(), auth, MEGASOFT_URI, true, {
        "Content-Type": 'text/xml'
    });
    const responseJson = parseResponse(responseXml, ['control', 'codigo', 'descripcion', 'vtid', 'seqnum', 'authid', 'authname', 'factura', 'referencia', 'terminal', 'lote', 'rifbanco', 'afiliacion'], 'response');
    // console.info(responseXml);
    return responseJson;
}