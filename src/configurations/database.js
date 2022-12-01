import mongoose from 'mongoose';

const {
    MONGO_HOSTNAME,
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_DB,
    MONGO_PORT,
    MONGO_AUTH_DATABASE
  } = process.env;


  const authenticate = () => MONGO_USERNAME && MONGO_PASSWORD;


  const URI = !authenticate()
    ? `mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}`
    : `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=${MONGO_AUTH_DATABASE}`;

  console.log(authenticate, URI);


  mongoose.connect(URI, {
    useNewUrlParser:true,
    useUnifiedTopology: true,
    readPreference: 'primary',
    directConnection: true,
    ssl: false
  })
  .then(() => console.log('Successfully connected!'))
  .catch(err => console.log(err))

  module.exports = mongoose;
