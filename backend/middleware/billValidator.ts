import Joi from "joi";

export const billSchema = Joi.object({

  project_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  vendor_name: Joi.string()
    .min(1)
    .required(),

  material_name: Joi.string()
    .min(1)
    .required(),

  quantity: Joi.number()
    .min(0)
    .optional()
    .allow(null),

  unit: Joi.string()
    .allow("")
    .optional(),

  amount: Joi.number()
    .min(0)
    .required(),

  gst_amount: Joi.number()
    .min(0)
    .optional()
    .allow(null),

  bill_number: Joi.string()
    .allow("")
    .optional(),

  bill_date: Joi.string()
    .allow("")
    .optional(),

  payment_status: Joi.string()
    .valid("Pending", "Paid", "Cancelled")
    .default("Pending"),

  remarks: Joi.string()
    .allow("")
    .optional(),

  ocr_text: Joi.any()
    .optional()
    .allow(null)

});

export const updateBillSchema = Joi.object({

  project_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  vendor_name: Joi.string()
    .min(1)
    .optional(),

  material_name: Joi.string()
    .min(1)
    .optional(),

  quantity: Joi.number()
    .min(0)
    .optional()
    .allow(null),

  unit: Joi.string()
    .allow("")
    .optional(),

  amount: Joi.number()
    .min(0)
    .optional(),

  gst_amount: Joi.number()
    .min(0)
    .optional()
    .allow(null),

  bill_number: Joi.string()
    .allow("")
    .optional(),

  bill_date: Joi.string()
    .allow("")
    .optional(),

  payment_status: Joi.string()
    .valid("Pending", "Paid", "Cancelled")
    .optional(),

  remarks: Joi.string()
    .allow("")
    .optional(),

  ocr_text: Joi.any()
    .optional()
    .allow(null)

});
