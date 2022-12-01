import PaymentBank from "../models/paymentBank";
import category from "../models/category";
import zipCode from "../models/zipCode";

export const getBanks = async () => {
  return await PaymentBank.find();
}

export const createdBanks = async (banks) => {
  await PaymentBank.deleteMany();
  return await PaymentBank.insertMany(banks);
}

export const getCategory = async () => {
  return await category.find({}, {_id: 0, __v: 0, isParent: 0})
}

export const updateCategories = async (params) => {
  const categoryIds = params.map(cat => cat.id);
  const categories = await category.find({ id: { $in: categoryIds } }, { _id: 0, __v: 0, isParent: 0 });
  for (let cat of categories) {
    const minAge = req.body.find(r => r.id === cat.id)?.minAge ?? 0;
    cat.minAge = minAge;
    await category.updateOne({id: cat.id}, { $set: { minAge } });
  }
  return categories;
}

export const getZipCodes = async () => {
  return await zipCode.find();
}

export const insertZipCodes = async (zipCodes) => {
  await zipCode.deleteMany();
  return zipCode.insertMany(zipCodes);
}