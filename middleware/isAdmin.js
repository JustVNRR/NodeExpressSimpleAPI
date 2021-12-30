import jwt from 'jsonwebtoken';
require('dotenv').config()


export default function isAdmin(req, res, next) {
    
    const authHeader = req.headers.authorization; //authorization: Bearer token...
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        next({ status: 401, message: "Undefined access token" });
        return
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { algorithm: 'HS512' }, (err, user) =>{

        if(err) return res.sendStatus(403);

        if ("admin" === user.role) {
            req.user = user;
            next();
        }
        else {
            next({ status: 401, message: "droits insuffisants" });
        }
    } )
}

// export default function isAdmin(req, res, next) {

//     if (undefined !== req.headers.authorization) {

//         const token = req.headers.authorization.split(' ')[1];

//         try {
//             let payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { algorithm: 'HS512' });

//             if ("admin" === payload.role) {
//                 next();
//             }
//             else {
//                 next({ status: 401, message: "droits insuffisants" });
//             }
//         }
//         catch (exception) {
//             //const message = exception.message;
//             //throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, `${message}`);
//             next({ status: 401, message: exception.message });
//         }
//     }
//     else{
//         next({ status: 401, message: exception.message });
//     }
// }