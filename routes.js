import express from 'express';

import isAuthenticate from './middleware/isAuthenticate';
import isAdmin from './middleware/isAdmin';

import produit from './controller/ProduitController';
import user from './controller/UserController';
import file from './controller/FileController';

const router = express.Router();

router.get('/produit', produit.indexPagi);
router.get('/produitfull', produit.index);
router.get('/produit/:id', produit.detail);
router.post('/produit', isAdmin, produit.add);
router.route('/produit/:id')
    .put(isAdmin, produit.edit)
    .patch(isAdmin, produit.edit);
router.delete('/produit/:id',isAdmin, produit.delete);
router.get("/visuals/:name", produit.downloadVisual);


router.get('/user', isAdmin, user.indexPagi);

router.get('/user/:id',/* isAuthenticate,*/ user.detail);

router.route('/user/:id')
    .put(isAuthenticate, user.edit)
    .patch(isAuthenticate, user.edit);

router.route('/user/avatar/:id')
    .put(isAuthenticate, user.avatar)
    .patch(isAuthenticate, user.avatar);
    // .put( user.avatar)
    // .patch( user.avatar);

router.delete('/user/:id', isAdmin, user.delete);
router.post('/api/auth/signin', user.login);
router.post('/api/auth/signup', user.register);
router.delete('/api/auth/signout', user.logout);

//router.post('/api/auth/token', user.createToken);


router.post('/user', isAdmin, user.register);
router.get("/avatars/:name", user.downloadAvatar);

router.post("/upload", file.upload);
router.get("/files", file.getListFiles);
router.get("/files/:name", file.download);
export default router;