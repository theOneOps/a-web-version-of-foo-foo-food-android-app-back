const express = require('express')

const router = express.Router()

const menuController = require('../controllers/menuController')

const {auth, isRestorer} = require('../middlewares/auth')


router.post('/', auth, isRestorer, menuController.createMenu)

router.get('/menusById/:restaurantId', menuController.getAllMenusByRestaurant)

router.get('/getAll', menuController.getAllMenus)

router.put('/:menuId', auth, isRestorer, menuController.updateMenu)

router.delete('/:menuId', auth, isRestorer, menuController.deleteMenu)

router.get('/someMenus', menuController.getSomeMenus)

module.exports = router;

