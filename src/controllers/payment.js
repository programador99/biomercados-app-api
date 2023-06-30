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

        // 
        cuotization.totals = {
            ...cuotization.totals,
            discount_amount: Math.abs(cuotization.totals?.discount_amount)
        };

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
        const response = await customerCreateOrder(params);
        res.status(200).json(response);
    } catch (error) {
        if (error?.code && error?.message) {
            registerLogError(error.message);
            res.status(400).json(error?.message);
        } else {
            registerLogError('error inesperado ' + JSON.stringify(error));
            res.status(500).json(error);
        }
    }
});

router.get('/c2p-banks', async (req, res) => {
    const banks = [
        {
            code: '0105',
            name: 'Mercantil Banco Universal',
            app: '✓',
            web: '-',
            sms: '✓',
            number: '24024',
            body: 'SCP'
          },
          {
            code: '0134',
            name: 'Banesco Banco Universal',
            app: '-',
            web: '✓',
            sms: '✓',
            number: '2846',
            body: 'clave(espacio)dinamica(espacio)Tipo de Identificacion V E J (numero identificacion)'
          },
          {
            code: '0102',
            name: 'Banco de Venezuela',
            app: '✓',
            web: '✓',
            sms: '✓',
            number: '2661-2662',
            body: 'Clave de pago'
          },
          {
            code: '0106',
            name: 'Banco Provincial',
            app: '✓',
            web: '-',
            sms: '-',
            number: '-',
            body: '-'
          },
          {
            code: '0191',
            name: 'Banco Nacional de Credito',
            app: '-',
            web: '✓',
            sms: '-',
            number: '-',
            body: '-'
          },
          {
            code: '0114',
            name: 'Bancaribe',
            app: '✓',
            web: '-',
            sms: '✓',
            number: '22741',
            body: 'CLAVEMIPAGO'
          },
          {
            code: '0172',
            name: 'Bancamiga Banco Universal',
            app: '✓',
            web: '-',
            sms: '-',
            number: '-',
            body: '-'
          },
          {
            code: '0163',
            name: 'Banco del Tesoro',
            app: '✓',
            web: '-',
            sms: '✓',
            number: '2383',
            body: 'COMERCIO(espacio)TIPO DE CEDULA V E (espacio)NUMERO DE IDENTIFICACION(espacio)COORDENADA'
          },
          {
            code: '0115',
            name: 'Banco Exterior',
            app: '✓',
            web: '-',
            sms: '✓',
            number: '278',
            body: 'CLAVE(espacio)TIPO DE IDENTIFICACION V E P (espacio) NUMERO DE IDENTIFICACION'
          },
          {
            code: '0151',
            name: 'BFC Banco Fondo Comun',
            app: '✓',
            web: '-',
            sms: '-',
            number: '-',
            body: '-'
          },
          {
            code: '0104',
            name: 'Banco Venezolano de Credito',
            app: '✓',
            web: '✓',
            sms: '-',
            number: '-',
            body: '-'
          },
          {
            code: '0177',
            name: 'Banco de la Fuerza Armada',
            app: '-',
            web: '-',
            sms: '✓',
            number: '??',
            body: 'CLAVE C2P(espacio)TIPO DE IDENTIFICACION V E (numero de identificacion)'
          },
          {
            code: '0174',
            name: 'Banplus Banco Universal',
            app: '✓',
            web: '-',
            sms: '-',
            number: '-',
            body: '-'
          },
          {
            code: '0138',
            name: 'Banco Plaza',
            app: '✓',
            web: '✓',
            sms: '✓',
            number: '1470',
            body: 'CLAVE(espacio)TIPO DE IDENTIFICACION V E P (espacio) NUMERO DE IDENTIFICACION'
          },
          {
            code: '0156',
            name: '100% Banco',
            app: '✓',
            web: '✓',
            sms: '✓',
            number: '100102',
            body: 'C2P (espacio)PAGO(espacio)MONTO(espacio)CLAVE DE OPERACIONES ESPECIALES'
          },
          {
            code: '0171',
            name: 'Banco Activo',
            app: '-',
            web: '-',
            sms: '✓',
            number: '228486',
            body: 'C2P + TIPO DE DOCUMENTO+NUMERO DE DOCUMENTO (todo mayuscula)'
          },
          {
            code: '0157',
            name: 'Del Sur Banco Universal',
            app: '-',
            web: '-',
            sms: '✓',
            number: '78910',
            body: 'COBROD2'
          },
          {
            code: '0137',
            name: 'Banco Sofitasa',
            app: '✓',
            web: '✓',
            sms: '-',
            number: '-',
            body: '-'
          },
          {
            code: '0169',
            name: 'Mi Banco, Banco Microfinanciero',
            app: '✓',
            web: '✓',
            sms: '✓',
            number: '22622',
            body: 'PAGAR'
          },
          {
            code: '0168',
            name: 'Bancrecer Banco Universal',
            app: '✓',
            web: '✓',
            sms: '-',
            number: '-',
            body: '-'
          },
          {
            code: '0175',
            name: 'Banco Bicentenario',
            app: '✓',
            web: '✓',
            sms: '-',
            number: '-',
            body: '-'
          },
          {
            code: '0128',
            name: 'Banco Caroni',
            app: '✓',
            web: '-',
            sms: '-',
            number: '-',
            body: '-'
          }
      ].sort( (a, b) => {
        if(a.name <= b.name ) {
            return -1;
        } else {
            return 0;
        }
      } );

      res.json(banks);
});

module.exports = router;
