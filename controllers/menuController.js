const Menu = require('../models/menu')
const Restaurants = require('../models/restaurants')


// create a menu, delete a menu, update a menu, get all menus

// get menus of a specific restaurant (id)
exports.getAllMenusByRestaurant = async (req, res) => 
    {
    try {
        const menu = await Menu.find({restaurantId: req.params.restaurantId}).sort({price: 1})
        if (!menu) return res.status(400).json({
            success: false, message: `no menus for the restaurantId of ${res.params.restaurantId}`
        })
        res.status(200).json({success: true, message: "here is all of the menus ", data: menu})
        // console.log("menus get successfully !")
    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
    }
}

// get all menus
exports.getAllMenus = async (req, res) => {
    try {
        const menus = await Menu.find()
        if (!menus) return res.status(400).json({
            success: false, message: `no menus found !`
        })
        res.status(200).json({success: true, message: "here is all of the menus ", data: menus})
        // console.log("menus get successfully !")
    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
    }
}

//create a menu
exports.createMenu = async (req, res) => {
    try {
        const requiredProperties = Object.keys(Menu.schema.obj).filter(field => Menu.schema.obj[field].required)

        const missingProperties = requiredProperties.filter(field => !req.body[field])

        if (missingProperties.length > 0) return res.status(400).json({
            success: false,
            message: `you miss some properties to create the menu ! ${missingProperties}`
        })

        const menu = new Menu(req.body)
        await menu.save()
        if (menu) await Restaurants.findByIdAndUpdate(req.body.restaurantId, {$push: {items: menu._id}}, {new: true})

        if (!menu) return res.status(500).json({success: false, message: "error in the creation of the menu"})
        res.status(201).json({success: true, message: `menu created successfully !`, data: [menu]})
        console.log(`menu ${menu} created successfully !`)

    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
    }
}

//update a menu
exports.updateMenu = async (req, res) => {
    try {
        const menu = await Menu.findByIdAndUpdate(req.params.menuId, req.body, {new: true})
        if (!menu) return res.status(404).json({success: false, message: 'Menu not found'});
        res.status(200).json({success: true, message: `${menu} updated successfully !`});
        console.log(`menu updated successfully : ${menu}`)
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
}

// delete a menu and same time, from the restaurant
exports.deleteMenu = async (req, res) => {
    try {
        const idOfMenuToDelete = req.params.menuId
        console.log(idOfMenuToDelete)
        const menu = await Menu.findById(idOfMenuToDelete)
        if (!menu) return res.status(400).json({success: false, message: "menu not found"})
        const restaurantId = menu.restaurantId
        await Menu.findByIdAndDelete(idOfMenuToDelete)
        await Restaurants.findByIdAndUpdate(restaurantId, {$pull: {items: idOfMenuToDelete}}, {new: true})
        res.status(200).json({success: true, message: `Menu with the id ${idOfMenuToDelete} deleted successfully !`})
    } catch (err) {
        res.status(400).json({success: false, message: err.message})
    }
}

// get some menus
exports.getSomeMenus = async (req, res) => {
    try {
        // récupérer les 4 menus aléatoires
        const menus = await Menu.aggregate([{ $sample: { size: 4 } }])
        if (!menus) return res.status(400).json({success: false, message: "no menus found !"})
        res.status(200).json({success: true, message: "here is some of the menus ", data: menus})
        console.log("menus get successfully !")
    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
    }
}