import express from "express";
import { activeCard, getCardTokenInformation, makePayment, sendMicroCharge } from "../../services/payment_gateways/net247";
import { registerLogError } from "../../middlewares/registerLog";
import { banesco } from "../../services/payment_gateways/banesco";

let router = express.Router();

router.get('/net247/check', async (req, res) => {
    try {
        const { encodedCard } = req.query;
        if (!encodedCard) {
            throw { code: 400, message: "el encodedCard es un query param requerido" }
        }
        const response = await getCardTokenInformation(encodedCard);
        res.status(200).json(response);
    } catch (error) {
        y
        if (error.code && error.message) {
            registerLogError(error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            registerLogError('error inesperado ' + JSON.stringify(error));
            res.status(500).json(error);
        }
    }
});

router.post('/net247/microCharge', async (req, res) => {
    try {
        const cardInformation = req.body;

        if (!cardInformation.account) {
            throw { code: 400, message: "El account es requerido." }
        }
        if (!cardInformation.expiry) {
            throw { code: 400, message: "El expiry es requerido." }
        }
        if (!cardInformation.postal) {
            throw { code: 400, message: "El postal es requerido." }
        }
        if (!cardInformation.cvv2) {
            throw { code: 400, message: "El cvv2 es requerido." }
        }

        const response = await sendMicroCharge(cardInformation);
        res.status(200).json(response);
    } catch (error) {
        if (error.code && error.message) {
            registerLogError(error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            registerLogError('error inesperado ' + JSON.stringify(error));
            res.status(500).json(error);
        }
    }
});

router.post('/net247/activeCard', async (req, res) => {
    try {
        const cardInformation = req.body;

        if (!cardInformation.account) {
            throw { code: 400, message: "el account es requerido en el payload" }
        }

        if (!cardInformation.value) {
            throw { code: 400, message: "el value es requerido en el payload" }
        }
        const response = await activeCard(cardInformation);
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        if (error.code && error.message) {
            registerLogError(error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            registerLogError('error inesperado ' + JSON.stringify(error));
            res.status(500).json(error);
        }
    }
});

router.post('/net247/pos/payment', async (req, res) => {
    try {
        const paymentCardInformation = req.body;

        if (!paymentCardInformation.amount) {
            throw { code: 400, message: "el amount es requerido en el payload" }
        }
        if (!paymentCardInformation.expiry) {
            throw { code: 400, message: "el expiry es requerido en el payload" }
        }
        if (!paymentCardInformation.account) {
            throw { code: 400, message: "el account es requerido en el payload" }
        }
        if (!paymentCardInformation.name) {
            throw { code: 400, message: "el name es requerido en el payload" }
        }
        if (!paymentCardInformation.cvv) {
            throw { code: 400, message: "el cvv es requerido en el payload" }
        }
        if (!paymentCardInformation.zip) {
            throw { code: 400, message: "el zip es requerido en el payload" }
        }
        if (!paymentCardInformation.address) {
            throw { code: 400, message: "el address es requerido en el payload" }
        }
        if (!paymentCardInformation.address2) {
            throw { code: 400, message: "el address2 es requerido en el payload" }
        }

        const response = await makePayment(paymentCardInformation);
        res.status(200).json(response);
    } catch (error) {
        if (error.code && error.message) {
            res.status(error.code).json(error.message);
        } else {
            registerLogError('error inesperado ' + JSON.stringify(error));
            res.status(500).json(error);
        }
    }
});

router.post('/banesco/check', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload) throw {
            code: 400,
            message: 'Comprobante invalido!'
        };

        const response = await banesco.check(payload);
        res.json(response);
    } catch (error) {
        if (error.code && error.message) {
            res.status(error?.code ?? 500).json(error?.message ?? 'Error inesperado del servidor');
        } else {
            registerLogError('Error inesperado ' + JSON.stringify(error));
            res.status(500).json(error);
        }
    }
});

export default router;