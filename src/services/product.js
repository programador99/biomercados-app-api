import Category from '../models/category';
import Product from '../models/product';
import ProductMoreSeller from '../models/productsMoreSeller.js'
import { httpGet } from './axios';
import { saveHistorySearch } from './users';


export const getProducts = async (params, storeId, userId, isAdult) => {

    if (userId) {
        await saveHistorySearch(userId, params.search);
    }

    const query = constructQuery(params, storeId, isAdult);
    const sort = constructSort(params);
    const paginate = constructPaginate(params);
    const count = await Product.find({ ...query, stores: { $elemMatch: { id: storeId, stock: { $gt: 0 }, price: { $gt: 0 } } } }, { _id: 0, __v: 0 }).count();
    const products = (await Product.find({ ...query, stores: { $elemMatch: { id: storeId, stock: { $gt: 0 }, price: { $gt: 0 } } } }, { _id: 0, __v: 0 }));

    console.info("productos", products.length)
    const filterProducts = search(params, products);
    // return filterProducts

    const total = formatProducts(filterProducts, storeId, filterProducts.length, params.search);
    return { products: paginateArray(10, total.products)[params?.page ?? 0], count: filterProducts.length  };
}

export const getBioinsuperables = async (storeId, isAdult) => {
    let query = {}
    if (isAdult) {
        query = {
            $match: {
                stores: { $elemMatch: { id: storeId, bioinsuperable: true } }
            }
        }
    } else {
        query = {
            $match: {
                stores: { $elemMatch: { id: storeId, bioinsuperable: true } },
                isAgeRestricted: false
            }
        }
    }

    const products = await Product.aggregate([
        query,
        { $sample: { size: 10 } }
    ]);
    return formatProduct(products, storeId);
}

function search(params, array) {
    let result = [];

    try {
        const { search, size, page } = params;

        let filter_part = search.split(' ');
        let products = array.map(item => {
            let flag = 0;

            filter_part.forEach(flt => {
                flt = flt?.toUpperCase();
                if (item.name.includes(flt)) {
                    flag += 4;

                    if (item.name.indexOf(flt) === 0) {
                        flag += 4;
                    }
                } else {
                    flag = flag ? flag : 0;
                }

                const description = item.description?.toUpperCase();
                if (description?.includes(flt)) {
                    flag += 2;
                }

                const brand = item?.brand?.label?.toUpperCase();
                if (brand && brand.includes(flt)) {
                    flag++;
                }

                const exp = new RegExp(`^${flt}$`);
                const name_split = item.name.split(' ');
                name_split.forEach(name => {
                    const match = name.match(exp);

                    if(match && name === match[0])
                        flag += 2;
                });
            });

            if (item.name.indexOf(search?.toUpperCase()) > -1) {
                flag += 2;
            }

            if (item.name.indexOf(search?.toUpperCase()) === 0) {
                flag += 3;
            }

            if (flag) {
                return { ...item?._doc, flag };
            }
        }).sort((a, b) => {
            if (a.flag >= b.flag) {
                return -1
            } else {
                return 0
            }
        }).filter(i => i || (i && i.flag));

        products.forEach(product => {
            if (result.length <= 0)
                result.push(product);
            else if (result.some(item => item.sku !== product.sku))
                result.push(product);
        });

        console.info(result)

        //return paginateArray(size, result)[page ?? 0];
        // return result
    } catch (error) {
        console.error(error)
    } finally {
        console.info(result.length)
        return result;
    }
}

const constructQuery = (params, storeId, isAdult) => {
    let query = {};
    let { categories, bioinsuperable, sponsored, brand, brandName, origin, packing, search } = params;
    /** filter for categories */
    if (categories) {
        categories = categories.split(",");
    } else {
        categories = []
    }
    const categoriesQuery = categories.map(category => {
        const QueryCategoryId =
        {
            categories:
            {
                $elemMatch:
                {
                    id: parseInt(category)
                }
            }
        };
        return QueryCategoryId;
    })

    const queryCategories = { $or: categoriesQuery };

    /** filter bioinsuperable */
    const queryBioInsuperable = { stores: { $elemMatch: { id: storeId, bioinsuperable: true } } };

    /** filter sponsored */
    const querySponsored = { sponsored };

    /** filter for brandName */
    const queryBrandName = { 'brand.label': brandName };

    /** filter for brand */
    const queryBrand = { 'brand.value': brand };

    /** filter for origin */
    const queryOrigin = { 'origin.value': origin };

    /** filter for packing */
    const queryPacking = { 'packing.value': packing };

    /** filter for search */
    let querySearch = {}
    if (search && search !== '') {
        querySearch = {}; /*search.includes(' ') || parseInt(search) ?
            //{ $text: { $search: search, $caseSensitive: false, $diacriticSensitive: false } } :
            {} :
            // { name: { $regex: search, $options: "i" } };
            { $or: [{ name: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }] };*/
    }
    console.info("elS", querySearch)

    /** query filter price 0 and stock 0 */

    const queryStockAndPrice = { stores: { $elemMatch: { id: storeId, stock: { $gt: 0 }, price: { $gt: 0 } } } }

    query = { ...query, ...queryStockAndPrice };

    if (categories.length > 0) {
        query = { ...query, ...queryCategories }
    }
    if (bioinsuperable) {
        query = { ...query, ...queryBioInsuperable }
    }
    if (sponsored) {
        query = { ...query, ...querySponsored }
    }
    if (brand) {
        query = { ...query, ...queryBrand }
    }
    if (brandName) {
        query = { ...query, ...queryBrandName }
    }
    if (origin) {
        query = { ...query, ...queryOrigin }
    }
    if (packing) {
        query = { ...query, ...queryPacking }
    }
    if (search && search !== '') {
        query = { ...query, ...querySearch }
    }

    /* limit for age */
    if (!isAdult) {
        const queryAge = {
            isAgeRestricted: false
        }
        query = { ...query, ...queryAge }
    }
    /* limit for age */

    return query;

}

const constructSort = (params) => {
    const { sort, direction } = params;
    let paramSort = {};
    if (sort == 'name') {
        paramSort[sort] = direction === 'ASC' ? 1 : -1;
    }
    if (sort == 'price') {
        paramSort[sort] = direction === 'ASC' ? 1 : -1;
    }
    paramSort._id = 1;
    return paramSort;
}

const constructPaginate = (params) => {
    const { page, size, search } = params;
    const filter_part = search.split(' ');
    let paginate = {
        skip: 0,
        limit: filter_part.length > 1 ? 0 : 10
    };
    if (page !== undefined && size !== undefined) {
        paginate = {
            skip: page * size,
            limit: size
        }
    }
    return paginate;
}


export const getProductBySku = async (sku) => {
    return await Product.find({ sku }, { _id: 0, __v: 0 });
};

export const autocompleteProductNameSearch = async (paramSearch, isAdult) => {
    let query = {}
    if (isAdult) {
        query = {
            name: { $regex: paramSearch, $options: "i" }
        }
    } else {
        query = {
            name: { $regex: paramSearch, $options: "i" },
            isAgeRestricted: false
        }
    }
    let resultsInMongo = (await
        Product.find(query).select('name')).map((product) => {
            return product.name;
        });
    let results = autoComplete(paramSearch, resultsInMongo);
    return results;

};


const autoComplete = (paramSearch, words) => {
    const searchs = words.map(word => {
        let length = paramSearch.length;
        let szWord = word.substr(0, length);
        if (szWord === paramSearch.toUpperCase()) {
            return word;
        }
    }).filter(item => item);

    return searchs;
}


export const getProductsMoreSeller = async (storeId, isAdult, page, size) => {

    const paginate = {
        skip: page * size,
        limit: size
    }
    let categories = await ProductMoreSeller.find({ storeId }, { _id: 0, __v: 0 }, paginate).populate('products');
    if (!isAdult) {
        categories = await extractProductRestricted(categories);
    }
    return formatProductsMoreSeller(categories, storeId);
}

export const extractProductRestricted = async (categories) => {
    let categoriesFormat = [];

    // Excluir categoria restringida
    for (const category of categories) {
        let dbCategory = await Category.find({ id: category.id }, { _id: 0, __v: 0 });

        if (!dbCategory[0]?.isAgeRestricted) {
            categoriesFormat.push(category);
        }
    }

    return categoriesFormat;
}

const formatProductsMoreSeller = (categories, storeId) => {
    let productsMoreSeller = [];
    let bioInsuperables = [];
    for (let category of categories) {
        category = JSON.parse(JSON.stringify(category));
        category.products = category.products.map(product => {

            let price = 0;
            let stock = 0;
            let bioinsuperable = false;
            if (storeId) {
                const productInStore = product.stores.filter(st => st.id == storeId)[0];
                if (productInStore) {
                    price = productInStore.price
                    stock = productInStore.stock
                    bioinsuperable = productInStore.bioinsuperable
                }
            }
            const formatProduct = {
                id: product.id,
                sku: product.sku,
                name: product.name,
                image: product.image,
                price,
                stock,
                bioinsuperable,
                tax: product.tax
            };
            return formatProduct;
        });

        // Metodo de ordenamiento
        if (category.products.length > 0) {
            if (category.id == -1) {
                bioInsuperables.push(category);
            } else {
                productsMoreSeller.push(category);
            }
        }

    }
    return [...bioInsuperables, ...productsMoreSeller];
}

export const getRelatedProducts = async (sku) => {
    const url = `rest/all/V1/products/${sku}`;
    const product = await httpGet(url);
    const sortAsc = (array) => {
        return array.sort((a, b) => (a.position > b.position) ? 1 : -1)
    };

    if (product) {
        const { product_links } = product;
        const sortedRelatedProducts = sortAsc(product_links);
        const nSortedRelatedProducts = await Promise.all(sortedRelatedProducts.map(async related => {
            const ProductDB = await Product.find({
                sku: related.linked_product_sku
            }, { _id: 0, __v: 0, categories: { _id: 0, __v: 0 } });

            return {
                ...ProductDB,
                position: related.position
            }
        }));
        return nSortedRelatedProducts;
    }
    return null;
}

const formatProducts = (products, storeId, count, search) => {
    const regexp = new RegExp(search, 'i');

    return {
        products: products.map(product => {
            let price = 0;
            let stock = 0;
            let bioinsuperable = false;
            if (storeId) {
                const productInStore = product.stores.filter(st => st.id == storeId)[0];
                if (productInStore) {
                    price = productInStore.price
                    stock = productInStore.stock
                    bioinsuperable = productInStore.bioinsuperable
                }
            }

            return {
                id: product.id,
                sku: product.sku,
                name: product.name,
                // price: product.price,
                image: product.image,
                price,
                stock,
                bioinsuperable,
                brand: product.brand,
                tax: product.tax,
                description: product.description
            };
        })/*.sort((a, b) => {
            let x = a.description.match(regexp) || a.name.match(regexp);
            let y = b.description.match(regexp) || b.name.match(regexp);
            x = x ? x[0].toLowerCase() : x;
            y = y ? y[0].toLowerCase() : y;
            return x ? -1 : y ? 1 : 0
        })*/,
        count
    }
}

export const formatProduct = (products, storeId) => {

    return products.map(product => {
        let price = 0;
        let stock = 0;
        let bioinsuperable = false;
        if (storeId) {
            const productInStore = product.stores.filter(st => st.id == storeId)[0];
            if (productInStore) {
                price = productInStore.price
                stock = productInStore.stock
                bioinsuperable = productInStore.bioinsuperable
            }
        }
        return {
            id: product.id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            image: product.image,
            price,
            stock,
            bioinsuperable,
            brand: product.brand,
            tax: product.tax
        };
    })
}

const paginateArray = (size, xs) =>
    xs.reduce((segments, _, index) =>
        index % size === 0
            ? [...segments, xs.slice(index, index + size)]
            : segments,
        []
    );