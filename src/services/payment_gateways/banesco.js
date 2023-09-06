import { http } from "../axios";

const returnResponse = (approved, message, type, arg) => {
    return {
        approved,
        message,
        type,
        arg
    };
}

export const banesco = {
    check: async function (payload) {
        const url = '/GtwBotonPago/BtnPago/conciliacion/readPay/leerPago';
        const tempPayLoad = {
            nroComprobante: payload.nroComprobante,
            apiKey: payload.apiKey,
            firma: payload.firma
        };

        const finalPayLoad = Buffer.from(JSON.stringify(tempPayLoad)).toString('base64');

        const { estatus, detalle } = await http.post(url, finalPayLoad, {
            "Content-Type": "text/plain"
        }).catch(err => {
            console.error(err);
            return null;
        });
        

        // Validacion general de respuesta
        if (estatus || estatus === '00') {
            // Estado de la transaccion
            if (detalle.estatus === 1) {
                // Exitoso
                if (payload.monto !== detalle.valor2) {
                    return returnResponse(false, 'AMOUNT_DOES_NOT_MATCH', 'Warning');
                } else {
                    return returnResponse(true, `APPROVED_PAYMENT`, 'Success', detalle.nro_referencia_banco);
                }
            } else if (detalle.estatus === 2) {
                // Cancelado por el cliente
                return returnResponse(false, "CANCELLED_OPERATION", 'Warning');
            } else if (detalle.estatus === 3) {
                // Cancelado por el banco
                return returnResponse(false, "TRANSACTION_DECLINED", 'Warning');
            } else if (detalle.estatus === 4) {
                // Error de comunicacion
                return returnResponse(false, "ERRCON_BANK", 'Warning');
            } else if (detalle.estatus === 5) {
                // Error tecnico
                return returnResponse(false, "UNEXPECTED_ERROR", 'Error');
            } else {
                // Error inesperado del API
                return returnResponse(false, "UNEXPECTED_ERROR", 'Error');
            }
        } else {
            return false;
        }
    }
};