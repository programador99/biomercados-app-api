import axiosApp from 'axios';
import https from 'https';

// Ignore Error Certificate
const axios = axiosApp.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

const baseUrl = process.env.BASE_URL_API_MAGENTO;
const bearerToken = process.env.BASE_BEARER_TOKEN_MAGENTO || '';
const headers = {
  "Authorization": `Bearer ${bearerToken}`,
  "Content-Type": "application/json"
}

export const httpGet = async (url, customerToken = bearerToken) => {
  const response = await axios.get(baseUrl + url, {
    headers: {
      ...headers,
      "Authorization": `Bearer ${customerToken}`
    }
   });
  return response.data;
}

export const httpPost = async (url, payload, customerToken = bearerToken, base = baseUrl, basic = false, head = headers) => {
  const { data } = await axios.post(base + url, payload, {
    headers: {
      ...head,
      "Authorization": `${!basic ? 'Bearer' : 'Basic'} ${customerToken}`
    },
  });
  return data;
}

export const httpPut = async (url, payload, customerToken = bearerToken) => {
  const { data } = await axios.put(baseUrl + url, payload, {
    headers: {
      ...headers,
      "Authorization": `Bearer ${customerToken}`
    },
  });
  return data;
}

export const httpDelete = async (url, customerToken = bearerToken) => {
  const { data } = await axios.delete(baseUrl + url, {
    headers: {
      ...headers,
      "Authorization": `Bearer ${customerToken}`
    },
  });
  return data;
}
