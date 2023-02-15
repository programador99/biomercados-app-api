import express from "express";
import { customerCreateOrder, customerShippingMethods, getPaymentInformation, getPaymentMethod, getShippingInformation, getShippingMethod, getShippingMethodByAddressId } from "../services/payment";
import paymentMethod from "../models/paymentmethod";
import PaymentBank from "../models/paymentBank"
import { registerLogError } from "../middlewares/registerLog";

let router = express.Router();

router.get('/get-payment-methods', async (req, res) => {
    try {
        const { cartId, customer_token } = req.query;
        if (!cartId) {
            throw { code: 400, message: 'El cartId es necesario' }
        }
        const response = await getPaymentInformation(customer_token).catch(e => {
            throw { code: e.response.status, message: e.response.data.message }
        });

        let paymentmethods = [];
        if (response) {
            for await (const method of response) {
                let payment = await paymentMethod.findOne({
                    code: method['code']
                }, { _id: 0 });

                payment = JSON.parse(JSON.stringify(payment));

                payment && paymentmethods.push({ ...method, ...payment });
            }
        }

        res.status(200).json(paymentmethods);

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

router.get('/get-shipping-methods', async (req, res) => {
    try {
        const { cartId } = req.query;
        if (!cartId) {
            throw { code: 400, message: 'El cartId es necesario' }
        }
        const response = await getShippingMethod(cartId).catch(e => {
            throw { code: e.response.status, message: e.response.data.message }
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
})



router.post('/get-shipping-methods', async (req, res) => {
    try {
        const params = req.body;

        // const response = await customerShippingMethods(params).catch(e => {
        const response = await getShippingMethodByAddressId(params).catch(e => {
            throw { code: e.response.status, message: e.response.data.message }
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
})

router.post('/cuotization', async (req, res) => {
    try {
        const { store_view, customer_id, customer_token, billing_address_id, shipping_address_id, shipping_carrier_code, shipping_method_code } = req.body;

        if (!store_view) {
            throw { code: 400, message: 'el store_view es requerido' }
        }

        if (!customer_id) {
            throw { code: 400, message: 'el customer_id es requerido' }
        }

        if (!customer_token) {
            throw { code: 400, message: 'el customer_token es requerido' }
        }

        if (!billing_address_id) {
            throw { code: 400, message: 'el billing_address_id es requerido' }
        }

        if (!shipping_address_id) {
            throw { code: 400, message: 'el shipping_address_id es requerido' }
        }

        if (!shipping_carrier_code) {
            throw { code: 400, message: 'el shipping_carrier_code es requerido' }
        }

        if (!shipping_method_code) {
            throw { code: 400, message: 'el shipping_method_code es requerido' }
        }


        const cuotization = await getShippingInformation(req.body).catch(e => {
            throw { code: e.response.status, message: e.response.data.message }
        });

        const paymentBanks = await PaymentBank.find({

        });

        cuotization.payment_methods = cuotization.payment_methods.map(pm => {
            const pb = paymentBanks.find(current => current.code === pm.code);

            // Desactivando net247
            // if (pm.code !== 'net247') {
                return {
                    ...pm,
                    title: pm.code === 'paypal_express' ? 'PayPal y Tarjetas Internacionales' : pm.title,
                    banks: pb?.banks.map( bank => bank?.store_view === store_view ? bank : null).filter(bank => bank) ?? [],
                    currency: pb?.currency ?? 2,
                    description: pb?.description
                }
            // } else {
            //     return null
            // }
        }).filter(pm => pm);

        res.json(cuotization);
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

router.post('/create-order', async (req, res) => {
    try {
        const { store_view, customer_id, customer_token, shipping_address_id, payment_method } = req.body;

        if (!store_view) {
            throw { code: 400, message: 'el store_view es requerido' }
        }

        if (!customer_id) {
            throw { code: 400, message: 'el customer_id es requerido' }
        }

        if (!customer_token) {
            throw { code: 400, message: 'el customer_token es requerido' }
        }

        if (!shipping_address_id) {
            throw { code: 400, message: 'el shipping_address_id es requerido' }
        }

        if (!payment_method) {
            throw { code: 400, message: 'el payment_method es requerido' }
        }

        const params = req.body;
        const response = await customerCreateOrder(params).catch(e => {
            throw { code: e.response.status, message: e.response.data.message }
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

module.exports = router;
