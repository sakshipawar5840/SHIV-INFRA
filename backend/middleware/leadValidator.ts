import Joi from "joi";


// ===============================
// CREATE LEAD VALIDATION
// ===============================

export const leadSchema = Joi.object({

  customer_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),


  project_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),


  lead_source: Joi.string()
    .required(),


  requirement: Joi.string()
    .allow("")
    .optional(),


  budget: Joi.number()
    .min(0)
    .optional(),


  preferred_location: Joi.string()
    .allow("")
    .optional(),


  status: Joi.string()
    .valid(
      "New",
      "Contacted",
      "Site Visit",
      "Negotiation",
      "Won",
      "Lost"
    )
    .default("New"),


  assigned_to: Joi.string()
    .uuid()
    .optional()
    .allow(null),


  remarks: Joi.string()
    .allow("")
    .optional()

});




// ===============================
// UPDATE LEAD VALIDATION
// ===============================

export const updateLeadSchema = Joi.object({

  customer_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),


  project_id: Joi.string()
    .uuid()
    .optional()
    .allow(null),


  lead_source:Joi.string()
    .optional(),


  requirement:Joi.string()
    .allow("")
    .optional(),


  budget:Joi.number()
    .min(0)
    .optional(),


  preferred_location:Joi.string()
    .allow("")
    .optional(),


  status:Joi.string()
    .valid(
      "New",
      "Contacted",
      "Site Visit",
      "Negotiation",
      "Won",
      "Lost"
    )
    .optional(),


  assigned_to:Joi.string()
    .uuid()
    .optional()
    .allow(null),


  remarks:Joi.string()
    .allow("")
    .optional()

});