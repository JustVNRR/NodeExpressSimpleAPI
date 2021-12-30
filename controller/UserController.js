import jwt from 'jsonwebtoken'
import { User } from '../models';
const uploadAvatar = require("../middleware/uploadAvatar");
const path = require('path');
const { Op } = require("sequelize");
const bcrypt = require('bcrypt')

require('dotenv').config()

//https://www.bezkoder.com/node-js-sequelize-pagination-mysql/
const getPagination = (page, size) => {
    const limit = size ? +size : 3;
    const offset = page ? page * limit - (size ? size : 3) : 0;

    return { limit, offset };
};


const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: users } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, users, totalPages, currentPage };
};

function generateAccessToken(user) {

    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,
        {
            algorithm: 'HS512',
            expiresIn: 1200
        });
}

//let refreshTokens = []; // Normalement il faudrait stocker les refreshtokens en database

class UserController {

    // async createToken(req, res) {
    //     const refreshToken = req.body.refreshToken;
    //     if (refreshToken == null) return res.sendStatus(401);
    //     if (this.refreshTokens.includes(refreshToken)) return res.sendStatus(403);

    //     jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, { algorithm: 'HS512' }, (err, user) => {
    //         if (err) return res.sendStatus(403);

    //         const accessToken = generateAccessToken( user ) //GENERE le MEME qu'AVANT?!?...
            
    //         res.json({ token: accessToken })
    //     })
    // }

    async login(req, res) {

        try {

            const user = await User.findOne(
                {
                    where: { login: req.body.login },
                    attributes: { exclude: ['createdAt', 'updatedAt'] }
                }
            );

            if (!user) {

                return res.status(401).json({ message: "login failed..." })
            }

            if (await bcrypt.compare(req.body.password, user.password)) {

                const payload = {
                    id: user.id,
                    pseudo: user.pseudo,
                    login: user.login,
                    role: user.role,
                    avatar: __baseurl + "/avatars/" + user.avatar
                };

                const accessToken = generateAccessToken(payload);

                const refreshToken = await jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET,{algorithm: 'HS512'});

                //refreshTokens.push(refreshToken); // Normalement il faudrait ajouter le token en base...

                res.json({
                    token: accessToken,
                    refreshToken: refreshToken,
                    id: user.id,
                    pseudo: user.pseudo,
                    login: user.login,
                    role: user.role,
                    avatar: __baseurl + "/avatars/" + user.avatar
                });
                return;
            }
            else {
                return res.status(401).json({ message: "login failed..." })
            }
        } catch (err) {
            res.status(500).json({ message: err.message });
        }

        // côté front il faudra enregistrer le token dans le local storage
        //pour pouvoir le renvoyer ensuite à l'API lors des requetes
        // en le placant dans une cle "Authorization" à mettre dans le header de la requete

    }

    async logout(req, res) {
        //refreshTokens = refreshTokens.filter(token => token !== req.body.refreshToken); // Normalement il faudrait supprimer le token de la base...
        res.sendStatus(204);
    }


    async register(req, res, next) {
        console.log("register")
        try {

            // console.log("req.body");
            // console.log(req.body);

            // const salt = await bcrypt.genSalt();
            // const hashedPassword = await bcrypt.hash(req.body.password, salt);

            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            const roleRequest = req.body.role ? req.body.role : "user";

            const userRequest = {
                pseudo: req.body.pseudo,
                login: req.body.login,
                password: hashedPassword,
                role: roleRequest
            }

            const user = await User.create(userRequest);

            res.status(201).json({
                id: user.id,
                pseudo: user.pseudo,
                login: user.login,
                role: user.role,
                avatar: __baseurl + "/avatars/mystery-avatar.png"
            });
        }
        catch (e) {
            next({ status: e.status, message: e.message });
        }
    }

    async index(req, res) {

        let users = await User.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });

        users.forEach(element => { element.avatar = __baseurl + "/avatars/" + element.avatar });

        res.json(users);
    }

    async indexPagi(req, res) {
        const { page, size, query } = req.query;

        console.log("req.query");
        console.log(req.query);

        //var condition = query ? { pseudo: { [Op.like]: `%${query}%` } } : null;
        var condition = query ? {
            [Op.or]: [
                { pseudo: { [Op.like]: `%${query}%` } },
                { login: { [Op.like]: `%${query}%` } }
            ]
        } : null;

        const { limit, offset } = getPagination(page, size);

        User.findAndCountAll({ where: condition, limit, offset, attributes: { exclude: ['createdAt', 'updatedAt'] } })
            .then(data => {
                const response = getPagingData(data, page, limit);

                response.users.forEach(element => { element.avatar = __baseurl + "/avatars/" + element.avatar });

                res.send(response.users);
            })
            .catch(err => {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while retrieving users."
                });
            });
    };

    async detail(req, res, next) {

        try {

            const id = req.params.id;

            const user = await User.findOne(
                {
                    where: { id },
                    attributes: { exclude: ['createdAt', 'updatedAt'] }
                }
            );

            if (user) {

                user.avatar = __baseurl + "/avatars/" + user.avatar;
                res.json(user);
                return;
            }

            next({ status: 404, message: 'Cette ressource n\'existe pas' });
        }
        catch (err) {
            next({ status: 500, message: err.message });
        }
    }

    async edit(req, res, next) {

        const id = req.params.id;

        try {
            const user = await User.update(req.body, { where: { id } });
            res.status(204).json(user);
        }
        catch (e) {

            next({ status: 500, message: e.message });
        }
    }
    async avatar(req, res, next) {

        const id = req.params.id;
        try {
            await uploadAvatar(req, res);

            if (req.file == undefined) {
                return res.status(400).send({ message: "Please upload a file!" });
            }
            const user = await User.update({ avatar: /*__baseurl + "/avatars/" + */req.file.originalname }, { where: { id } });
            console.log("user")
            console.log(user)
            res.status(204).json(user);
        }
        catch (e) {
            next({ status: 500, message: e.message });
        }
    }

    async delete(req, res, next) {

        const id = req.params.id;

        try {
            const deleted = await User.destroy({ where: { id } });

            if (0 < deleted) res.status(204).json();
        }
        catch (e) {
            next({ status: 500, message: e.message });
        }
    }

    async downloadAvatar(req, res) {
        const fileName = req.params.name;

        const fullName = path.join(__dirname, "..", "resources", "static", "assets", "uploads", "users", fileName);

        res.download(fullName, fileName, (err) => {
            if (err) {
                res.status(500).send({
                    message: "Could not download the file. " + err,
                });
            }
        });
    };
}

export default new UserController();

/*import jwt from 'jsonwebtoken'
import { User } from '../models';
const uploadAvatar = require("../middleware/uploadAvatar");
const path = require('path');
const { Op } = require("sequelize");
const bcrypt = require('bcrypt')

require('dotenv').config()

//https://www.bezkoder.com/node-js-sequelize-pagination-mysql/
const getPagination = (page, size) => {
    const limit = size ? +size : 3;
    const offset = page ? page * limit - (size ? size : 3) : 0;

    return { limit, offset };
};


const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: users } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, users, totalPages, currentPage };
};

class UserController {

    

    refreshTokens = []; // Normalement il faudrait stocker les refreshtokens en database


    async createToken(req, res) {
        const refreshToken = req.body.token;
        if(refreshToken == null) return res.sendStatus(401);
        if(this.refreshTokens.includes(refreshToken)) return res.sendStatus(403);

        jwt.verify(refreshToken, process.env.ACCESS_TOKEN_SECRET, { algorithm: 'HS512' }, (err, user) =>{
            if(err) return res.sendStatus(403);
    
            const accessToken = generateAccessToken({ pseudo: user.pseudo})
            res.json({token: accessToken})
        } )

    }

    async login(req, res) {


        function generateAccessToken(user) {

            return jwt.sign(JSON.stringify(user), process.env.ACCESS_TOKEN_SECRET,
                {
                    algorithm: 'HS512',
                    expiresIn: 1200
                });
        }

        try {

            const user = await User.findOne(
                {
                    where: { login: req.body.login },
                    attributes: { exclude: ['createdAt', 'updatedAt'] }
                }
            );

            if (!user) {

                return res.status(401).json({ message: "login failed..." })
            }

            if (await bcrypt.compare(req.body.password, user.password)) {

                const payload = {
                    id: user.id,
                    pseudo: user.pseudo,
                    login: user.login,
                    role: user.role,
                    avatar: __baseurl + "/avatars/" + user.avatar
                };

                const accessToken = await jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET,
                {
                    algorithm: 'HS512',
                    expiresIn: 1200
                });

                const accessToken = await jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET,
                    {
                        algorithm: 'HS512',
                        expiresIn: 1200
                    });

                // const accessToken = await generateAccessToken(payload);
                const refreshToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,
                    {
                        algorithm: 'HS512'
                    });
                    refreshTokens.push(refreshToken); // Normalement il faudrrait ajouter le toekn en base...

                res.json({
                    token: accessToken,
                    refreshToken: refreshToken,
                    id: user.id,
                    pseudo: user.pseudo,
                    login: user.login,
                    role: user.role,
                    avatar: __baseurl + "/avatars/" + user.avatar
                });
                return;
            }
            else {
                return res.status(401).json({ message: "login failed..." })
            }
        } catch (err) {
            // res.status(err.status).json({ message: err.message });
            res.status(500).json({ message: err.message });
        }

        // côté front il faudra enregistrer le token dans le local storage
        //pour pouvoir le renvoyer ensuite à l'API lors des requetes
        // en le placant dans une cle "Authorization" à mettre dans le header de la requete

    }

    async logout(req, res) {
        refreshTokens = refreshTokens.filter(token => token !== req.body.refreshToken); // Normalement il faudrait supprimer le token de la base...
        res.sendStatus(204);
    }

    async register(req, res, next) {

        try {

            // console.log("req.body");
            // console.log(req.body);

            // const salt = await bcrypt.genSalt();
            // const hashedPassword = await bcrypt.hash(req.body.password, salt);

            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            const roleRequest = req.body.role ? req.body.role : "user";

            const userRequest = {
                pseudo: req.body.pseudo,
                login: req.body.login,
                password: hashedPassword,
                role: roleRequest
            }

            const user = await User.create(userRequest);

            res.status(201).json({
                id: user.id,
                pseudo: user.pseudo,
                login: user.login,
                role: user.role,
                avatar: __baseurl + "/avatars/mystery-avatar.png"
            });
        }
        catch (e) {
            next({ status: e.status, message: e.message });
        }
    }

    async index(req, res) {

        let users = await User.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });

        users.forEach(element => { element.avatar = __baseurl + "/avatars/" + element.avatar });

        res.json(users);
    }

    async indexPagi(req, res) {
        const { page, size, query } = req.query;

        console.log("req.query");
        console.log(req.query);

        //var condition = query ? { pseudo: { [Op.like]: `%${query}%` } } : null;
        var condition = query ? {
            [Op.or]: [
                { pseudo: { [Op.like]: `%${query}%` } },
                { login: { [Op.like]: `%${query}%` } }
            ]
        } : null;

        const { limit, offset } = getPagination(page, size);

        User.findAndCountAll({ where: condition, limit, offset, attributes: { exclude: ['createdAt', 'updatedAt'] } })
            .then(data => {
                const response = getPagingData(data, page, limit);

                response.users.forEach(element => { element.avatar = __baseurl + "/avatars/" + element.avatar });

                res.send(response.users);
            })
            .catch(err => {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while retrieving users."
                });
            });
    };

    async detail(req, res, next) {

        try {

            const id = req.params.id;

            const user = await User.findOne(
                {
                    where: { id },
                    attributes: { exclude: ['createdAt', 'updatedAt'] }
                }
            );

            if (user) {

                user.avatar = __baseurl + "/avatars/" + user.avatar;
                res.json(user);
                return;
            }

            next({ status: 404, message: 'Cette ressource n\'existe pas' });
        }
        catch (err) {
            next({ status: 500, message: err.message });
        }
    }

    async edit(req, res, next) {

        const id = req.params.id;

        try {
            const user = await User.update(req.body, { where: { id } });
            res.status(204).json(user);
        }
        catch (e) {

            next({ status: 500, message: e.message });
        }
    }
    async avatar(req, res, next) {

        const id = req.params.id;
        try {
            await uploadAvatar(req, res);

            if (req.file == undefined) {
                return res.status(400).send({ message: "Please upload a file!" });
            }
            const user = await User.update({ avatar: req.file.originalname }, { where: { id } });
            console.log("user")
            console.log(user)
            res.status(204).json(user);
        }
        catch (e) {
            next({ status: 500, message: e.message });
        }
    }

    async delete(req, res, next) {

        const id = req.params.id;

        try {
            const deleted = await User.destroy({ where: { id } });

            if (0 < deleted) res.status(204).json();
        }
        catch (e) {
            next({ status: 500, message: e.message });
        }
    }

    async downloadAvatar(req, res) {
        const fileName = req.params.name;

        const fullName = path.join(__dirname, "..", "resources", "static", "assets", "uploads", "users", fileName);

        res.download(fullName, fileName, (err) => {
            if (err) {
                res.status(500).send({
                    message: "Could not download the file. " + err,
                });
            }
        });
    };
}

export default new UserController(); */