import Joi from "joi";

export const expenseSchema = Joi.object({

  project_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  bill_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  expense_title: Joi.string()
    .allow("")
    .optional(),

  title: Joi.string()
    .allow("")
    .optional(),

  description: Joi.string()
    .allow("")
    .optional(),

  category: Joi.string()
    .allow("")
    .optional(),

  expense_category: Joi.string()
    .allow("")
    .optional(),

  amount: Joi.number()
    .min(0)
    .required(),

  expense_date: Joi.string()
    .isoDate()
    .optional()
    .allow(null),

  payment_method: Joi.string()
    .allow("")
    .optional(),

  payment_mode: Joi.string()
    .allow("")
    .optional(),

  vendor: Joi.string()
    .allow("")
    .optional(),

  remarks: Joi.string()
    .allow("")
    .optional()

});

export const updateExpenseSchema = Joi.object({

  project_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  bill_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  expense_title: Joi.string()
    .allow("")
    .optional(),

  title: Joi.string()
    .allow("")
    .optional(),

  description: Joi.string()
    .allow("")
    .optional(),

  category: Joi.string()
    .allow("")
    .optional(),

  expense_category: Joi.string()
    .allow("")
    .optional(),

  amount: Joi.number()
    .min(0)
    .optional(),

  expense_date: Joi.string()
    .isoDate()
    .optional()
    .allow(null),

  payment_method: Joi.string()
    .allow("")
    .optional(),

  payment_mode: Joi.string()
    .allow("")
    .optional(),

  vendor: Joi.string()
    .allow("")
    .optional(),

  remarks: Joi.string()
    .allow("")
    .optional()

});
