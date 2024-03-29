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
    // const paginate = constructPaginate(params);
    // const count = await Product.find({ ...query, stores: { $elemMatch: { id: storeId, stock: { $gt: 0 }, price: { $gt: 0 } } } }, { _id: 0, __v: 0 }).count();
    const products = (await Product.find({ ...query, stores: { $elemMatch: { id: storeId, stock: { $gt: 0 }, price: { $gt: 0 } } } }, { _id: 0, __v: 0 }));

    // console.info("productos", products.length)
    const categories = await Category.find(null, { __v: 0, _id: 0 });
    const filterProducts = params.search ? search({ ...params, storeId }, products, categories) : positionFirstProductCategory(products, params?.bioinsuperable);
    // return filterProducts

    const total = formatProducts(filterProducts, storeId, filterProducts.length, params.search);
    return { products: paginateArray(10, total.products)[params?.page ?? 0], count: filterProducts.length };
}

export const getBioinsuperables = async (storeId, productId, isAdult) => {
    let query = {}
    let subquery = {};

    const product = parseInt(productId) && await Product.findOne({
        id: parseInt(productId)
    });

    let categoryId = 0;
    if (product) {
        const { categories } = product;
        categoryId = categories.find(cat => cat.isParent === true)?.id;

    }

    if (categoryId) {
        subquery = {
            categories: { $elemMatch: { id: categoryId } }
        };
    }

    if (isAdult) {
        query = {
            $match: {
                stores: { $elemMatch: { id: storeId, stock: { $gt: 0 }, price: { $gt: 0 } } },
                id: { $ne: parseInt(productId) },
                ...subquery
            }
        }
    } else {
        query = {
            $match: {
                stores: { $elemMatch: { id: storeId, stock: { $gt: 0 }, price: { $gt: 0 } } },
                id: { $ne: parseInt(productId) },
                isAgeRestricted: false,
                ...subquery
            }
        }
    }

    let products = await Product.aggregate([
        query,
        // { $sample: { size: 10 } }
    ]);
    // let products = await Product.find({ ...query })

    products = products.sort((a, b) => {
        const aS = a?.stores.some(st => st.bioinsuperable === true) ? 1 : 0;
        const bS = b?.stores.some(st => st.bioinsuperable === false) ? 0 : 1;
        let value = randomIntFromInterval(-1, 1);

        if (aS >= bS) {
            return value;
        } else {
            return 0;
        }
    })
    return formatProduct(products, storeId).slice(0, 10);
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

// Algoritmo de posicionamiento de productos en catalogo
// prioridad a los productos de la propia categoria con foto
function positionFirstProductCategory(array, bioinsuperable = null) {
    const products = array.map(product => {
        const productCategories = product.categories.filter(category => category.isParent === true);

        if (productCategories.length > 1) {
            return {
                ...product._doc,
                flag: product.image.includes('bio_placeholder') ? -1 : 0
            };
        } else {
            return {
                ...product._doc,
                flag: product.image.includes('bio_placeholder') ? 1 : 2
            };
        }
    }).filter(product => product.stores.some(store => (bioinsuperable && store.bioinsuperable === true) || !bioinsuperable)).sort((a, b) => {
        if (a.flag >= b.flag) {
            return -1
        } else {
            return 0
        }
    });

    return products;
}

function cleanText(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Algoritmo de busqueda
function search(params, array, categories) {
    let result = [];

    try {
        let { search, storeId, size, page } = params;
        const off_product_words = ['bio insuperable', 'bio insuperables', 'bioinsuperable', 'bioinsuperables', 'oferta', 'ofertas'];

        // Maestro de categorias para filtrado 
        search = search?.trim();
        let cleanSearch = cleanText(search);
        let filter_part = search.split(' ');
        let categoriesFiltres = [];

        if (categories && categories.length > 0) {
            categoriesFiltres = categories.map(category => {
                let catName = cleanText(category.name.toLowerCase());
                if (catName.includes(cleanSearch.toLowerCase())) {
                    return category.id;
                }
            }).filter(item => item);
        }

        let products = array.map(item => {
            let flag = 0;

            // Filtrar productos coincidentes a la categoria
            categoriesFiltres.forEach(categoryId => {
                if (item?.categories?.some(itemCat => itemCat.id === categoryId)) {
                    flag += 10;
                }
            });

            // Busca palabras clave para ofertas o bio insuperables
            off_product_words.forEach(word => {
                if (search?.toLowerCase()?.includes(word)) {
                    if (item.stores.some(st => st.id === storeId && st.bioinsuperable === true)) {
                        flag += 100;
                    }

                    if (!item.image.includes('bio_placeholder')) {
                        flag += 10;
                    }
                }
            });

            if (flag || flag >= 100) {
                return { ...item?._doc, flag };
            }
            // Fin palabras claves ofertas o bio insuperables

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
                    flag += 4;
                }

                const exp = new RegExp(`^${flt}$`);
                const name_split = item.name.split(' ');
                name_split.forEach(name => {
                    const match = name.match(exp);

                    if (match && name === match[0])
                        flag += 2;
                });

                // Desfragmentando palabra por (-)
                const fragment_letter = flt.split('-');
                if (item.name.indexOf(fragment_letter.join(' ')) > -1) {
                    flag += 2;
                }
                fragment_letter.forEach(letter => {
                    if (item.name.includes(letter)) {
                        flag += 2;
                    }
                });
                // Fin desfragmento palabra

            });

            // Valida si posee la palabra buscada en cualquier seccion del nombre del producto
            if (item.name.indexOf(search?.toUpperCase()) > -1) {
                flag += 2;
            }

            // Valida si posee la palabra buscada al inicio del nombre del producto
            if (item.name.indexOf(search?.toUpperCase()) === 0) {
                flag += 3;
            }

            // Valida si la primeras dos palabras del nombre del producto coinciden con la oracion buscada en cualquier seccion del nombre
            const extractPortionName = item.name?.toUpperCase().split(' ').slice(0, 2).join(' ');
            if (extractPortionName.indexOf(search?.toUpperCase()) > -1) {
                flag += 2;
            }

            // Valida si la primeras dos palabras del nombre del producto coinciden con la oracion buscada al inicio del nombre
            if (extractPortionName.indexOf(search?.toUpperCase()) === 0) {
                flag += 3;
            }

            // Excluye los productos que no tuvieron exito en la busqueda
            if (flag || flag > 0) {
                return { ...item?._doc, flag };
            }
        }).filter(i => i || (i && (i.flag || i.flag > 0)))
            .sort((a, b) => {
                if (a.flag >= b.flag) {
                    return -1
                } else {
                    return 0
                }
            });

        products.forEach(product => {
            if (result.length <= 0)
                result.push(product);
            else if (result.some(item => item.sku !== product.sku))
                result.push(product);
        });

        // console.info(result)

        //return paginateArray(size, result)[page ?? 0];
        // return result
    } catch (error) {
        console.error(error)
    } finally {
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
    return await formatProductsMoreSeller(categories, storeId);
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

const getTotalDays = (dateString = -1) => {
    if (!dateString || dateString === '') {
        return 0;
    }

    const date = new Date(dateString);
    const current = new Date();
    const difference = date.getTime() - current.getTime();
    const totalDays = Math.ceil(difference / (1000 * 3600 * 24));
    return totalDays;
};

const formatProductsMoreSeller = async (categories, storeId) => {
    let productsMoreSeller = [];
    let bioInsuperables = [];
    for (let category of categories) {
        category = JSON.parse(JSON.stringify(category));
        category.products = (await Promise.all(category.products.map(async product => {
            const dbProduct = await Product.findOne({
                sku: product
            }, { __v: 0, _id: 0 });

            let price = 0;
            let stock = 0;
            let bioinsuperable = false;
            let oferta = false;
            if (storeId) {
                const productInStore = dbProduct.stores.filter(st => st.id == storeId)[0];
                if (productInStore) {
                    price = productInStore.price;
                    stock = productInStore.stock;
                    bioinsuperable = productInStore.bioinsuperable;
                    oferta = productInStore.oferta;
                }
            }
            const formatProduct = {
                id: dbProduct.id,
                sku: dbProduct.sku,
                name: dbProduct.name,
                image: dbProduct.image,
                price,
                stock,
                bioinsuperable,
                oferta,
                tax: dbProduct.tax,
                expirationpush: dbProduct?.expirationpush
            };
            return formatProduct;
        }))).sort((a, b) => {
            // Priorizar productos por fecha de posicionamiento con expiracion
            const dateA = getTotalDays(a?.expirationpush);
            const dateB = getTotalDays(b?.expirationpush);

            // Si el posicionamiento esta vencido
            if(dateA < 0) {
                return 0;
            }

            return dateB-dateA;
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
            let oferta = false;
            if (storeId) {
                const productInStore = product.stores.filter(st => st.id == storeId)[0];
                if (productInStore) {
                    price = productInStore.price
                    stock = productInStore.stock
                    bioinsuperable = productInStore.bioinsuperable
                    oferta = productInStore.oferta;
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
                oferta,
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
        let oferta = false;
        if (storeId) {
            const productInStore = product.stores.filter(st => st.id == storeId)[0];
            if (productInStore) {
                price = productInStore.price
                stock = productInStore.stock
                bioinsuperable = productInStore.bioinsuperable
                oferta = productInStore.oferta;
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
            oferta,
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