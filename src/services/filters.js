import { httpGet } from "./axios";

const constructCustomAtributes = async () => {
  const url =
    "rest/V1/products/attributes?searchCriteria[filterGroups][0][filters][0][field]=attribute_code&searchCriteria[filterGroups][0][filters][0][value]=marca,empaque,origen&fields=items[attribute_code,options]&searchCriteria[filterGroups][0][filters][0][condition_type]=in"
  return (await httpGet(url)).items;
}

export const getfilters = async () => {
  const customAttributes = await constructCustomAtributes();
  let filters = {};
  for (const attribute of customAttributes) {
    filters[attribute.attribute_code] = []
    attribute.options.forEach(option => {
      if (option.value!=="") {
        filters[attribute.attribute_code].push(option);
      } 
    })
  }

  delete filters.marca;
  return filters;
}