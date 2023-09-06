import 'dotenv/config' 

import { mapDOM } from "./MapDOM";

const  MEDIA_URL_MAGENTO  = process.env.MEDIA_URL_MAGENTO || 'https://beta.biomercados.com.ve/media/';

export const extractSlideBlock = (str) => {
    let json = [];
    let stringHtml = "";

    if (typeof str == 'string') {
        stringHtml = str.replace(/\\/g, '');
        let initIndex = stringHtml.indexOf('div');
        stringHtml = stringHtml.substring(initIndex - 1);
        json = extractSlideBlock(mapDOM(stringHtml));
    }

    if (typeof str == 'object') {
        if (str.content.length <= 1) {
            json = extractSlideBlock(str.content[0]);
        } else if (str.content.length > 1) {
            return str;
        }
    }

    return json;
};

export const constructJSON = (sliders) => {
    if (!sliders) return null;

    const urlMedia = MEDIA_URL_MAGENTO;
    let result = [];
    let temp = {};
    if (sliders.content.length === 1) {
        if (sliders.content[0].hasOwnProperty('attributes')) {
            // Extraccion link url
            if (sliders.content[0].attributes.hasOwnProperty('href')) {
                temp = { ...sliders.content[0].attributes, search_filter: sliders.content[0].attributes.href.split('/?q=')[1] };
            }
            // Extraccion de image url
            if (sliders.content[0].attributes.hasOwnProperty('data-background-images')) {
                temp = { ...sliders.content[0].attributes }
            } else {
                let mediaTemp = JSON.parse(constructJSON(sliders.content[0])[0]['data-background-images']);
                mediaTemp['desktop_image'] = urlMedia + mediaTemp['desktop_image'].replace(/{{media url=|}}/g, '');
                mediaTemp['mobile_image'] = urlMedia + mediaTemp['mobile_image'].replace(/{{media url=|}}/g, '');

                result = [{ media: mediaTemp }];
            }
        } else {
            result = [...constructJSON(sliders.content[0])];
        }
    }

    // JSON Consutruido
    result.push(temp);

    return result;
};

export const getInformation = (html) => {
    return extractSlideBlock(html);
    
}

export const organizeJsonSlider = (brutSliders) => {
    // Organizacion del JSON
    brutSliders = extractSlideBlock(brutSliders);

    let sliders = [];
    for (let slider of brutSliders.content) {
        if (slider) {
            let nSlider = constructJSON(slider);
            sliders.push({ ...nSlider[0], ...nSlider[1] });
        }
    }

    return sliders;
};