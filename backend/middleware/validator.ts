import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorDetails = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed.",
        details: errorDetails,
      });
    }
    next();
  };
};

// Standard input validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const projectSchema = Joi.object({

  project_name: Joi.string()
    .min(3)
    .required(),

  project_type: Joi.string()
    .required(),

  location: Joi.string()
    .required(),

  city: Joi.string()
    .required(),

  state: Joi.string()
    .required(),

  pincode: Joi.string()
    .required(),

  description: Joi.string()
    .allow("")
    .optional(),


  flat_types: Joi.string()
    .allow("")
    .optional(),


  total_units: Joi.number()
    .min(0)
    .optional()
    .allow(null),


  available_units: Joi.number()
    .min(0)
    .optional()
    .allow(null),


  area_sqft: Joi.number()
    .optional()
    .allow(null),


  price: Joi.number()
    .optional()
    .allow(null),


  brochure_url: Joi.string()
    .allow("")
    .optional(),


  thumbnail_url: Joi.string()
    .allow("")
    .optional(),


  gallery: Joi.array()
    .items(Joi.string())
    .optional()
    .allow(null),


  amenities: Joi.array()
    .items(Joi.string())
    .optional()
    .allow(null),


  contact_person: Joi.string()
    .allow("")
    .optional(),


  contact_number: Joi.string()
    .allow("")
    .optional(),


  status: Joi.string()
    .valid(
      "active",
      "inactive",
      "completed"
    )
    .default("active")

});

export const leadSchema = Joi.object({
  name: Joi.string().min(2).required(),
  phone: Joi.string().min(10).max(15).required(),
  email: Joi.string().email().optional().allow(""),
  requirement: Joi.string().optional().allow(""),
  status: Joi.string().valid("New", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Booked", "Rejected", "Not Interested", "Won", "Lost").default("New"),
  source: Joi.string().optional().allow(""),
  assigned_sales_id: Joi.string().uuid().optional().allow(null),
  location: Joi.string().optional().allow(""),
  budget: Joi.string().optional().allow(""),
  notes: Joi.string().optional().allow(""),
});

export const expenseSchema = Joi.object({

  project_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),


  bill_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),


  expense_category: Joi.string()
    .optional()
    .allow(""),


  expense_title: Joi.string()
    .optional()
    .allow(""),


  amount: Joi.number()
    .min(1)
    .required(),


  expense_date: Joi.string()
    .isoDate()
    .optional()
    .allow(null),


  payment_method: Joi.string()
    .optional()
    .allow(""),


  remarks: Joi.string()
    .optional()
    .allow(""),


  description: Joi.string()
    .optional()
    .allow(""),


  category: Joi.string()
    .optional()
    .allow(""),


  title: Joi.string()
    .optional()
    .allow("")

});
