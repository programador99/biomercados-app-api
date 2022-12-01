import axios from "axios";

const { NET247_X_API_KEY, NET247_MERCHANT_ID } = process.env;

const httpGet = async (url) => {
    const response = await axios.get(url, {
        baseURL: "https://24-7net.net/api/v1",
        headers: {
            "x-api-key": NET247_X_API_KEY
        }
    });
    return response;
};

const httpPost = async (url, payload) => {
    const response = await axios.post(url, payload, {
        baseURL: "https://24-7net.net/api/v1",
        headers: {
            "x-api-key": NET247_X_API_KEY
        }
    });
    return response;
};

export const getCardTokenInformation = async (encodedCard) => {
    if (encodedCard && encodedCard !== '') {
        const url = `/tokenize/check/${encodedCard}`;
        const response = await httpGet(url);
        return validationCard(response.data);
    }
}

const validationCard = (cardInformation) => {
    const { data } = cardInformation;

    if (data.active === true && data.blocked === false) {
        return {
            status: "verified",
            valid: true,
            numRetries: data.numRetries
        }
    } else if (data.active === false && data.blocked === false) {
        return {
            status: "pending",
            valid: false,
            numRetries: data.numRetries
        }
    } else {
        return {
            status: "blocked",
            valid: false,
            numRetries: data.numRetries
        }
    }
};

/**
 * MicroCargo
 */
export const sendMicroCharge = async (cardInformation) => {
    if (cardInformation) {
        const url = '/tokenize';

        const response = await httpPost(url, {
            ...cardInformation,
            merchantId: NET247_MERCHANT_ID
        });
        return response.data;
    }
    return null;
};

/**
 * Activar Tarjeta
 * Finalizar proceso MicroCargo
 */
export const activeCard = async (cardInformation) => {
    if (cardInformation) {
        const url = '/tokenize/activate';
        const response = await httpPost(url, cardInformation);
        return response.data;
    }
    return null;
};

export const makePayment = async (paymentCardInformation) => {
    const url = '/pos/payment/online/sale';
    const payload = {
        ...paymentCardInformation,
        // tender: "tender1",
        merchantId: NET247_MERCHANT_ID,
        customFields: {
            caja: "ecommerce"
        },
        // virtualMerchantId: NET247_MERCHANT_ID,
        serviceFeeAndTaxes: {
            subtotal: 0.1,
            serviceFee: 0.1,
            countyTax: 0.1,
            federalTax: 0.1
        },
        subchannel: "api"
    };
    // return payload;
    const response = await httpPost(url, payload);
    return response.data;
};