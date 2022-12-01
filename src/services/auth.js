import { httpPost, httpPut } from "./axios";
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';
import RefreshToken from '../models/refreshToken';

export const authUser = async (username, password) => {
  const url = 'rest/V1/integration/customer/token';
  const responseToken = await httpPost(url, { username, password });
  const timestamp = (new Date).getTime();

  await saveRereshToken(responseToken, username, timestamp);

  return { token: responseToken, timestamp };
}

export const createUser = async (customerData) => {
  const url = 'rest/V1/customers';
  let response = {};
  response = await httpPost(url, customerData)
  return response;
};

export const sendTokenChangePassword = async (email) => {
  const url = `rest/V1/customers/password`;
  const response = await httpPut(url, { email, template: 'email_reset' });
  return response;
};

export const changePassword = async (email, password, resetToken) => {
  const url = 'rest/V1/customers/resetPassword';
  const response = await httpPost(url, { email, resetToken, newPassword: password });
  return response;
};

export const loginSocial = async (email) => {
  const url = 'rest/V1/custom/login';
  let response = JSON.parse((await httpPost(url, { emailId: email })));

  response = { ...response, timestamp: (new Date).getTime() };
  const timestamp = response?.timestamp;
  const tokenUser = response?.token;
  await saveRereshToken(tokenUser, email, timestamp);

  return JSON.stringify(response);
};

export const getRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({ token });

  if (!refreshToken) {
    return null;
  }

  return await loginSocial(refreshToken.email);
}

export const validateCurrentToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({ token });

  if (!refreshToken) {
    return null;
  }

  return {
    token: refreshToken?.token
  };
}

export const saveRereshToken = async (token, email, timestamp) => {
  await RefreshToken.deleteMany({ email });
  await RefreshToken.insertMany([{ email, token, timestamp }]);
}

// Firebase Auth
export const authFireBase = async (email, token) => {

};

export const authFacebook = async (token) => {
  const url = `https://graph.facebook.com/v14.0/me?access_token=${token}&fields=id,name,email&format=json&suppress_http_code=1&transport=cors`;
  return (await axios.get(url)).data;

}

export const authGoogle = async (token) => {
  const url = `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`;
  return (await axios.get(url)).data;
}

export const authApple = async (token) => {
  const { header } = jwt.decode(token, {
    complete: true
  })

  const kid = header.kid
  const client = jwksClient({
    jwksUri: "https://appleid.apple.com/auth/keys",
    timeout: 30000
  });

  const publicKey = (await client.getSigningKey(kid)).getPublicKey();
  const { sub, email } = jwt.verify(token, publicKey);

  return { sub, email };
}
