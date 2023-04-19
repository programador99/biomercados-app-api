import  express  from "express";
import  path  from "path";
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import 'dotenv/config' 

import mongoose from './configurations/database';
import cors from './configurations/cors'
import createRouter from "./controllers/index"
import multer from "./configurations/multer"


const app = express();
app.use(cors());

// view engine setup and send static files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.set('port',process.env.PORT|| 3010)

app.use(express.json());

app.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});
app.use(multer);


//create router
createRouter(app);


const server = app.listen(app.get('port'),()=>{
  console.log('server on port ' +  app.get('port'))
}) 


module.exports = app;
