import cors from 'cors'

const whitelist = ['*'];
const options = {
  origin: (origin, callback) => {
    if (whitelist.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('no permitido'));
    }
  }
}
cors({
  origin: 'http://localhost',
  optionsSuccessStatus: 200
})

module.exports = cors;