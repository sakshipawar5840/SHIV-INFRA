import Joi from "joi";


// ===============================
// CREATE CUSTOMER VALIDATION
// ===============================

export const customerSchema = Joi.object({

  full_name: Joi.string()
    .min(2)
    .max(100)
    .required(),

  phone: Joi.string()
    .min(10)
    .max(15)
    .required(),

  email: Joi.string()
    .email()
    .allow("")
    .optional(),

  address: Joi.string()
    .allow("")
    .optional(),

  city: Joi.string()
    .allow("")
    .optional(),

  state: Joi.string()
    .allow("")
    .optional(),

  pincode: Joi.string()
    .allow("")
    .optional(),

  interested_location: Joi.string()
    .allow("")
    .optional(),

  interested_property_type: Joi.string()
    .allow("")
    .optional(),

  budget: Joi.number()
    .min(0)
    .optional(),

  source: Joi.string()
    .allow("")
    .optional(),

  notes: Joi.string()
    .allow("")
    .optional(),

  status: Joi.string()
    .valid(
      "active",
      "inactive"
    )
    .default("active")

})
.unknown(false);




// ===============================
// UPDATE CUSTOMER VALIDATION
// ===============================

export const updateCustomerSchema = Joi.object({

  full_name: Joi.string()
    .min(2)
    .max(100)
    .optional(),

  phone: Joi.string()
    .min(10)
    .max(15)
    .optional(),

  email: Joi.string()
    .email()
    .allow("")
    .optional(),

  address: Joi.string()
    .allow("")
    .optional(),

  city: Joi.string()
    .allow("")
    .optional(),

  state: Joi.string()
    .allow("")
    .optional(),

  pincode: Joi.string()
    .allow("")
    .optional(),

  interested_location: Joi.string()
    .allow("")
    .optional(),

  interested_property_type: Joi.string()
    .allow("")
    .optional(),

  budget: Joi.number()
    .min(0)
    .optional(),

  source: Joi.string()
    .allow("")
    .optional(),

  notes: Joi.string()
    .allow("")
    .optional(),

  status: Joi.string()
    .valid(
      "active",
      "inactive"
    )
    .optional()

})
.min(1)
.unknown(false);