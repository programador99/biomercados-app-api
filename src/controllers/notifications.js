import express from "express";
import { asigneUserIdToUserNotificationForDeviceId, saveUserNotification, sendNotification } from "../services/notifications";

import { registerLogError } from "../middlewares/registerLog";


let router = express.Router();

router.post('/register-android', async (req, res) => { 
  try {
    const { userId, deviceId, token } = req.body;

    if(!userId) {
      throw { code: 400, message: "Debe mandar el userId en el body de la request" }
    }

    if(!token) {
      throw { code: 400, message: "Debe mandar el token en el body de la request" }
    }

    await saveUserNotification(userId, deviceId, token).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });

    res.status(200).json('ok');
    
  } catch (error) {
    if (error.code && error.message) {
      res.status(error.code).json(error);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});


router.post('/register-ios', async (req, res) => { 
  try {
    const { userId, deviceId, token } = req.body;

    if(!deviceId) {
      throw { code: 400, message: "Debe mandar el deviceId en el body de la request" }
    }

    if(!token) {
      throw { code: 400, message: "Debe mandar el token en el body de la request" }
    }

    await saveUserNotification(userId, deviceId, token).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });

    res.status(200).json('ok');
    
  } catch (error) {
    if (error.code && error.message) {
      res.status(error.code).json(error);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.put('/register-ios', async (req, res) => { 
  try {
    const { userId, deviceId } = req.body;

    if(!userId) {
      throw { code: 400, message: "Debe mandar el userId en el body de la request" }
    }

    if(!deviceId) {
      throw { code: 400, message: "Debe mandar el deviceId en el body de la request" }
    }

    await asigneUserIdToUserNotificationForDeviceId(deviceId, userId).catch(e => {
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    
    res.status(200).json('ok');
    
  } catch (error) {
    if (error.code && error.message) {
      res.status(error.code).json(error);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.post('/send-notification', async (req, res) => { 
  try {
    const { userIds, notification } = req.body;

    const { message, data } = notification;

    if(!userIds || userIds.length < 1) {
      throw { code: 400, message: "Debe mandar el userIds en el body de la request" }
    }

    if(!notification) {
      throw { code: 400, message: "Debe mandar el notification en el body de la request" }
    }

    if(!data) {
      throw { code: 400, message: "Debe mandar el data en el body de la request" }
    }

    await sendNotification(userIds, message, data).catch(e => {
      console.log(e);
      throw { code: 400, message: "Error en la consulta a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });

    res.status(200).json('ok');
    
  } catch (error) {
    if (error.code && error.message) {
      res.status(error.code).json(error);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});


export default router;