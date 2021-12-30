import jwt from 'jsonwebtoken';
require('dotenv').config()

export default function isAuthenticate(req, res, next) {
    
    // const authHeader = req.headers['authorization'];
    const authHeader = req.headers.authorization; //authorization: Bearer token...
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        next({ status: 401, message: "Undefined access token" });
        return
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { algorithm: 'HS512' }, (err, user) =>{
        if(err) return res.sendStatus(403);
        req.user = user;
        next();

    } )

    // try {
    //     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { algorithm: 'HS512' });

    //     next();
    // }
    // catch (exception) {
    //     next({ status: exception.status, message: exception.message });
    // }
}