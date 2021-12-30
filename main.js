import express from 'express';
import colors from 'colors';
import routes from './routes'
import helmet from 'helmet';
import bodyParser from 'body-parser'
import cors from 'cors';

const app = express();

app.use(helmet());

// var corsOptions = {
//     origin: "http://localhost:8081"
// };

//app.use(cors(corsOptions));  

app.use(cors()); //Pour authoriser les appli front à acceder à l'api...

//récupère les données envoyées au format json
// content-type: application/json

app.use(bodyParser.json());

app.use(routes);

app.use((err, req, res, next) => {

    if (!err)
        return next();

        console.log("err")
        console.log(err)

    res.statusCode = err.status
    res.json({
        status: err.status,
        message: err
    });
});

app.use((req, res, next) => {

    res.statusCode = 404;
    res.json({
        status: 404,
        message: 'Not Found'
    });

});

const port = process.env.PORT || 3200;

global.__baseurl = `http://localhost:${port}`;

app.listen(port, 'localhost', () => {
    console.log(`Personal Node Server is listening on ${colors.blue(__baseurl)}`);
    console.log(`Shutdown Node Server with CTRL + C`.green);
});