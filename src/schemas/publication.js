const publicationAddSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    images: { type: "array" },
    isPublic: { type: "boolean" },
  },
  required: ["title", "description", "images", "isPublic"],
  additionalProperties: false
};

const publicationEditSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    images: { type: "array" },
    isPublic: { type: "boolean" },
  },
  additionalProperties: true
};

const publicationTransferSchema = {
  type: "object",
  properties: {
    idOldOwner: { type: "string" },
    idNewOwner: { type: "string" }
  },
  required: ["idOldOwner", "idNewOwner"],
  additionalProperties: true
};
module.exports = {publicationAddSchema , publicationEditSchema, publicationTransferSchema};