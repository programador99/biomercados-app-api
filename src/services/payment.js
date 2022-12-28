import { httpGet, httpPost } from "./axios"
import { getCustomerById, getOrder } from "./users"


export const getShippingMethod = async (cartId) => {
    const url = 'rest/V1/carts/' + cartId + '/shipping-methods';
    return await httpGet(url);
}

export const getShippingMethodByAddressId = async (params) => {
    const { customer_token, addressId, cartId, storeView } = params;
    const url = `rest/V1/${storeView}/carts/mine/estimate-shipping-methods-by-address-id`;
    console.info(customer_token, addressId)
    return await httpPost(url, { addressId, cart_id: cartId });
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
    const { store_view, customer_id, customer_token, shipping_address_id, payment_method } = params;
    const customer = await getCustomerById(customer_id);

    if (customer) {

        const billingAddress = customer.addresses.find(address => address.id == shipping_address_id);

        if (billingAddress) {
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

            const orderInformation = await httpPost(`rest/${store_view}/V1/carts/mine/payment-information`, payload, customer_token);
            const order = await getOrderById(orderInformation);

            return { order_id: order.increment_id };
        }
    }
};