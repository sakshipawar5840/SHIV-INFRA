const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET;
const payload = {
  id: "88888888-8888-8888-8888-888888888888",
  company_id: "74834208-4783-4783-4783-420847834208",
  email: "shivinfra55@gmail.com",
  role: "Admin"
};

const token = jwt.sign(payload, secret, { expiresIn: "7d" });
console.log("TOKEN:", token);
