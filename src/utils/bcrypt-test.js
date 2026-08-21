import bcrypt from "bcrypt";

const password = "Deepak@12345";
const hashedPassword = await bcrypt.hash(password, 10);
console.log(hashedPassword);
