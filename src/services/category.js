import Category from '../models/category';

export const getCategoriesPrincipal = async (isAdult) => {
  let query = {}
  if (isAdult) {
    query = {
      isParent: true,
    }
  } else {
    query = {
      isParent: true,
      isAgeRestricted: false
    }
  }
  return await Category.find(query, { _id: 0, __v: 0, isParent: 0, parent_id: 0 });
}

export const getCategory = async (id, isAdult) => {
  let query = {}
  if (isAdult) {
    query = {
      parent_id: id,
    }
  } else {
    query = {
      parent_id: id,
      isAgeRestricted: false
    }
  }

  let category = JSON.parse(JSON.stringify(await Category.findOne({ id }, { _id: 0, __v: 0, image: 0, isParent: 0 })));
  if (category.parent_id == 2) {
    delete category.parent_id;
  }
  let categoriesChild = await Category.find(query, { _id: 0, __v: 0, image: 0, isParent: 0, parent_id: 0 });
  category.children = categoriesChild;
  return category;
}
