const bcrypt = require("bcryptjs")

async function hashPassword() {
    const password = await bcrypt.hash("okokok", 8);
    console.log(`password hashe : ${password}`);
}
hashPassword()
