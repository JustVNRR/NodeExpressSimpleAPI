import { Produit } from '../models';
const uploadVisual = require("../middleware/uploadVisual");
const path = require('path');
const { Op } = require("sequelize");

//https://www.bezkoder.com/node-js-sequelize-pagination-mysql/
const getPagination = (page, size) => {
    const limit = size ? +size : 3;
    const offset = page ? page * limit - (size ? size : 3) : 0;

    return { limit, offset };
};

const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: products } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, products, totalPages, currentPage };
};

class ProduitController {
    async index(req, res) {

        const products = await Produit.findAll({ attributes: { exclude: ['createdAt', 'updatedAt'] } });

        products.forEach(element => {

            if (element.img && element.img.indexOf("http") < 0) {
                element.img = __baseurl + "/visuals/" + element.img;
            }
        });

        res.json(products); //Array
    }

    async indexPagi(req, res) {
        const { page, size, query } = req.query;

        // console.log("req.query");
        // console.log(req.query);

        //var condition = query ? { pseudo: { [Op.like]: `%${query}%` } } : null;
        var condition = query ? {
            [Op.or]: [
                { nom: { [Op.like]: `%${query}%` } },
                { desc: { [Op.like]: `%${query}%` } }
            ]
        } : null;

        const { limit, offset } = getPagination(page, size);

        setTimeout(() => { // Pour simuler une latence dans la réponse de l'API...
            Produit.findAndCountAll({ where: condition, limit, offset, attributes: { exclude: ['createdAt', 'updatedAt'] } })
                .then(data => {
                    const response = getPagingData(data, page, limit);

                    //  console.log("response")
                    //  console.log(response)

                    response.products.forEach(element => {

                        if (element.img && element.img.indexOf("http") < 0) {
                            element.img = __baseurl + "/visuals/" + element.img;
                        }
                    });

                    res.send(response.products);
                })
                .catch(err => {
                    res.status(500).send({
                        message:
                            err.message || "Some error occurred while retrieving products."
                    });
                });
        }, 300)
    };


    async detail(req, res, next) {

        const id = req.params.id;

        // Product.findBOne(
        //     {
        //         where: { id },
        //         attributes: { exclude: ['createdAt', 'updatedAt'] }
        //     }
        // )

        Produit.findByPk(id, { attributes: { exclude: ['createdAt', 'updatedAt'] } })
            .then(product => {

                if (product) res.json(product);

                next({ status: 404, message: 'Cette ressource n\'existe pas' });
            })
            .catch(err => {

                next({ status: 500, message: err.message });
            });
    }

    async add(req, res, next) {

        try {
            await uploadVisual(req, res);
            let body = req.body;
            if (req.file !== undefined) {
                body.img = req.file.originalname;
            }

            const produit = await Produit.create(body);

            res.status(201).json({
                id: produit.id,
                nom: produit.nom,
                desc: produit.desc,
                img: __baseurl + "/visuals/" + produit.img,
                prix: produit.prix,
                stock: produit.stock
            });

            // res.status(201).json(produit);
        }
        catch (e) {

            next({ status: 500, message: e.message });
        }
    }

    async edit(req, res, next) {

        const id = req.params.id;
        const body = req.body;

        try {

            const produit = await Produit.update(body, { where: { id } });
            res.status(204).json(produit);
        }
        catch (e) {

            next({ status: 500, message: e.message });
        }
    }

    async delete(req, res, next) {

        const id = req.params.id;

        try {
            const deleted = await Produit.destroy({ where: { id } });

            if (0 < deleted) res.status(204).json();

            next();
        }
        catch (e) {
            next({ status: 500, message: e.message });
        }
    }

    async downloadVisual(req, res) {
        const fileName = req.params.name;

        const fullName = path.join(__dirname, "..", "resources", "static", "assets", "uploads", "visuals", fileName);

        res.download(fullName, fileName, (err) => {
            if (err) {
                res.status(500).send({
                    message: "Could not download the file. " + err,
                });
            }
        });
    };
}

export default new ProduitController();