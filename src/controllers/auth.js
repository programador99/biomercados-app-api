import express from "express";
import {
  authApple,
  authFacebook,
  authGoogle,
  authUser,
  changePassword,
  createUser,
  sendTokenChangePassword,
  loginSocial,
  getRefreshToken,
  validateCurrentToken,
  matchedUser,
  getMatchedUser
} from "../services/auth"
import { createHistorySearch, getHistorySearch, getUser } from "../services/users";

import { registerLogError } from "../middlewares/registerLog";

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userMagento = await getUser(username).catch(e => {
      throw { code: e.response.status, message: e.response.data.message }
    });
    let user = {};
    if (userMagento) {
      user = {
        id: userMagento.id,
        email: userMagento.email,
        firstname: userMagento.firstname,
        lastname: userMagento.lastname
      }
      const isUserSearch = await getHistorySearch(user.id);
      if (!isUserSearch) {
        await createHistorySearch(user.id);
      }
    } else {
      throw { code: 400, message: "Ususario no registrado" }
    }

    const { token, timestamp } = await authUser(username, password).catch(e => {
      throw { code: e.response.status, message: e.response.data.message }
    });

    res.status(200).json({ token, timestamp, user });
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

router.post('/refresh-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw { code: 400, message: "El token es requerido" }
    }

    const response = await getRefreshToken(token).catch(e => {
      throw { code: e.response.status, message: e.response.data.message }
    });

    // Usuario no autorizado para refrescamiento de token
    if (!response) {
      throw { code: 401, message: "Error al refrescar token" }
    }

    res.json(JSON.parse(response));
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error)
    }
  }
});

router.post('/login-biometric', async (req, res) => {
  try {
    const { username, biometric } = req.body;
    const userMagento = await getUser(username).catch(e => {
      throw { code: e.response.status, message: e.response.data.message }
    });

    let user = {};
    if (userMagento) {
      user = {
        id: userMagento.id,
        email: userMagento.email,
        firstname: userMagento.firstname,
        lastname: userMagento.lastname
      }
      const isUserSearch = await getHistorySearch(user.id);
      if (!isUserSearch) {
        await createHistorySearch(user.id);
      }
    } else {
      throw { code: 400, message: "Ususario no registrado" }
    }

    const resLogin = await loginSocial(user?.email, biometric).catch(e => {
      throw { code: e.response.status, message: e.response.data.message }
    });

    const { token, timestamp } = JSON.parse(resLogin);

    res.status(200).json({ token, timestamp, user });
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

router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw { code: 400, message: "El token es requerido" }
    }

    const response = await validateCurrentToken(token).catch(e => {
      throw { code: e.response.status, message: e.response.data.message }
    });

    // Usuario no autorizado para refrescamiento de token
    if (!response) {
      throw { code: 401, message: "El token invalido." }
    }

    res.json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error)
    }
  }
});

router.post('/social-login', async (req, res) => {
  try {
    const { social, token } = req.body;
    if (!social || (social != 'facebook' && social != 'google' && social != 'apple')) {
      throw { code: 400, message: "Debe definir la red social los valores pueden ser ('facebook' || 'google' || 'apple') recibido " + social }
    }

    if (!token) {
      throw { code: 400, message: "Debe enviar un token" }
    }

    let response = null;
    /**caso facebook */
    if (social == 'facebook') {
      response = await authFacebook(token).catch(e => {
        throw { code: e.response.status, message: e.response.data.message }
      })

      if (response.error) {
        throw { code: 403, message: response.error.message }
      }
    }

    /**caso google */
    if (social == 'google') {
      response = await authGoogle(token).catch(e => {
        throw { code: e.response.status, message: e.response.data.message }
      })

      if (response.error) {
        throw { code: 403, message: response.error.message }
      }
    }

    /**caso apple */
    if (social == 'apple') {
      response = await authApple(token).catch(e => {
        throw { code: e.response.status, message: e.response.data.message }
      })

      if (response.error) {
        throw { code: 403, message: response.error.message }
      }
    }

    if (response && response.email) {
      const { name, email } = response;
      let userMagento = await getUser(email).catch(e => {
        throw { code: e.response.status, message: e.response.data.message }
      });
      let user = {};

      if (!userMagento) {
        const userName = name ? name : email.split('@')[0];
        const nameArray = userName.split(' ');
        const firstname = nameArray.shift();
        let lastname = '';
        nameArray.forEach((name) => { lastname = lastname + ' ' + name });
        const password = 'A#1' + Math.random().toString(36).slice(2);
        const customer = {
          firstname,
          lastname: lastname ? lastname : firstname,
          taxvat: '0',
          email,
          custom_attributes: [
            {
              attribute_code: 'document_type',
              value: '1918'
            },
            {
              attribute_code: 'terms_and_conditions',
              value: '1'
            }
          ]
        };
        userMagento = await createUser({ customer, password }).catch(e => {
          throw { code: e.response.status, message: e.response.data.message }
        });
      }

      if (!userMagento) {
        throw { code: 400, message: "Usuario no registrado" }
      }

      user = {
        id: userMagento.id,
        email: userMagento.email,
        firstname: userMagento.firstname,
        lastname: userMagento.lastname
      }
      const isUserSearch = await getHistorySearch(user.id);
      if (!isUserSearch) {
        await createHistorySearch(user.id);
      }

      const resLogin = await loginSocial(email).catch(e => {
        throw { code: e.response.status, message: e.response.data.message }
      });

      const tokenUser = JSON.parse(resLogin)?.token;

      res.status(200).json({ token: tokenUser, user });
    } else {
      res.status(500).json(response);
    }


  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error)
    }
  }
});

router.get('/get-matched-user/:userId/:deviceId', async (req, res, next) => {
  try {
    console.info("hola");
    const props = req.params;
    console.info(props);
    const userMatched = await getMatchedUser(props);
    res.json(userMatched);
  } catch (error) {
    registerLogError(error.message);
    res.status(400).json(error.message);
  } finally {
    next();
  }
});

router.post('/matched-user', async (req, res, next) => {
  try {
    const props = req.body;
    const userMatched = await matchedUser(props);
    res.json(userMatched);
  } catch (error) {
    registerLogError(error.message);
    res.status(400).json(error.message);
  } finally {
    next();
  }
});

router.post('/register', async (req, res) => {
  try {
    const customerData = req.body;
    const response = await createUser(customerData).catch(e => {
      throw { code: e.response.status, message: e.response.data.message }
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message)
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error)
    }
  }
});

router.put('/sendTokenChangePassword', async (req, res) => {
  try {
    const { email } = req.body;
    const response = await sendTokenChangePassword(email).catch(e => {
      throw { code: e.response.status, message: e.response.data.message }
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message)
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error)
    }
  }
});

router.put('/changePassword', async (req, res) => {
  try {
    const { email, password, resetToken } = req.body;
    const response = await changePassword(email, password, resetToken).catch(e => {
      throw { code: e.response.status, message: e.response.data.message }
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

export default router;
