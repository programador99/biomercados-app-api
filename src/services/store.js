import { httpGet } from './axios';
import Store from '../models/store';
import Legal from '../models/legal';
import FrequentQuestions from '../models/frequentQuestion';
import { getInformation, organizeJsonSlider } from '../libs/util';
import zipCode from "../models/zipCode";

const  BASE_URL_API_MAGENTO  = process.env.BASE_URL_API_MAGENTO +'media/'|| 'https://beta.biomercados.com.ve/media/';

export const getStores = async () => {
  let listStore = await Store.find({}, { _id: 0, __v: 0 });
  if (!listStore || listStore.length == 0) {
    listStore = await constructStore();
  }
  return listStore;
}

const constructStore = async () => {
  await Store.deleteMany();
  const url = 'rest/V1/store/storeConfigs';
  const listStores = await httpGet(url);
  let stores = [];
  for (const store of listStores) {
    const storeInStores = stores.filter(storeInList => storeInList.store_id === store.website_id)[0];
    const indexStoreInStores = stores.indexOf(storeInStores);
    if (indexStoreInStores == -1) {
      const formatStore = {
        store_id: store.website_id,
        storeViews: [
          {
            id: store.id,
            codde: store.code
          }
        ]
      }
      stores.push(formatStore);
    } else {
      const storeView = {
        id: store.id,
        codde: store.code
      }
      stores[indexStoreInStores].storeViews.push(storeView)
    }
  }
  stores = await Store.insertMany(stores);
  return stores;
}

/**
 * storeView es != store
 * @param {*} storeView 
 * @param {*} sku 
 * @returns await Promise<any>
 */
export const getStockStatuses = async (storeView = "view_manongo_esp", sku) => {
  const url = `rest/${storeView}/V1/stockStatuses/${sku}`;
  return await httpGet(url);
}

/**
 * Obtener tasa de cambio VED
 */
export const getTax = async () => {
  const url = '/rest/V1/directory/currency';
  const { exchange_rates } = await httpGet(url);

  return exchange_rates.filter(tax => tax.currency_to === 'VEF')[0];
};

/**
 * Obtener Paises y Estados asociados
 */
export const getCountries = async () => {
  const url = 'rest/V1/directory/countries/';
  return (await httpGet(url)).map(country => {
    return {
      id: country.id,
      name: country.full_name_locale
    }
  });
}
export const getCountry = async (id) => {
  const url = 'rest/V1/directory/countries/'+id;
  return await httpGet(url);
}


export const getBanners = async (id) => {
  const url = `rest/V1/cmsBlock/${id}`;
  const block = await httpGet(url);

  if (block) {
    const { content, active } = block;

    if (active === false) return null;

    // Casting de bloque
    const sliders = organizeJsonSlider(content);
    return formatBanners(sliders);
  }
  
  return null;
}

export const getLegalId = async (legalKey) => {
  return await Legal.findOne({ key: legalKey })
}

export const getCMSBlock = async (id) => {
  const url = `rest/V1/cmsBlock/${id}`;
  const block = await httpGet(url);

  if (block) {
    const { content, active } = block;
    let information = getInformation(content);
    information.content = formatInformation(information);
    information = convertInformationToHtml(information);
    return { content: information };
  }
  
  return null;
}

const convertInformationToHtml = (information) => {
  let attributes = '';

  if (information['attributes']) {
    for (let [key, value] of Object.entries(information['attributes'])) {
      if (key == 'src') {
        value = BASE_URL_API_MAGENTO + value.replace(/{{media url=|}}/g, '')
        }
        attributes = attributes + ' '  + key + '='  +'"'+value+'"' ;
      }
  }

  const tagOpen = '<' + information['type'] + attributes+ '>';
  const tagOpenForImage = '<' + information['type'] + attributes+ '/>';
  const tagClose = '</' + information['type'] + '>';
  let value = '';
  let response = '';
  

  information['content']?.forEach(ctx => {
    if (typeof ctx == 'string') { 
        value += ctx
    }

    if (typeof ctx == 'object') {
          value += convertInformationToHtml(ctx);
    }
  })


  if (information['type'] == 'img') {
    response = tagOpenForImage ;

  } else { 
    response = tagOpen + value + tagClose;    
  }
  

  return response;
}


const formatInformation = (information) => {
  let contentFormat = []
  information['content']?.forEach(ctx => {
    if (typeof ctx == 'string') { 
      ctx = ctx.replace("\r\n", '').trim();
    }

    if (typeof ctx == 'object') {
        ctx.content = formatInformation(ctx);
    }

    if (ctx) {
      contentFormat.push(ctx) 
    }
  })
  return contentFormat
}

const formatBanners = (banners) => {
  return banners.map(banner => {
    let brand = null;
    if (banner.search_filter) {
      let arrayBrand = banner.search_filter.split("+");
      arrayBrand.forEach(section => {
        brand = brand ? brand + ' ' + section : section;
      })
      brand = brand.toUpperCase()
    }
    return {
      image : {
        mobile: banner.media.mobile_image.replace('.jpeg' || '.png', '.webp'),
        desktop: banner.media.desktop_image.replace('.jpeg' || '.png', '.webp'),
      },
      brand: brand
    }
  })
}

/**
 * Obtener listado de preguntas frecuentes
 */
 export const getFrequentQuestions = async () => {
  const frequentQuestions = await FrequentQuestions.find({}, { _id: 0, __v: 0 });
  if(frequentQuestions) {
    return frequentQuestions;
  }
 };

export const getZipCodes = async (region_id) => {
  return await zipCode.find({dest_region_id: region_id})
}