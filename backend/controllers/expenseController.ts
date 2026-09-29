import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "../config/supabase.ts";
import { mockExpenses, Expense } from "../database/mockDB.ts";


export class ExpenseController {


  // ===============================
  // GET ALL EXPENSES
  // ===============================

  static async getExpenses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ){

    const companyId = req.user!.company_id;


    const { project_id, expense_category } = req.query;


    try{

      let expenses:any[] = [];


      if(isSupabaseConfigured){


        let query = supabase
          .from("expenses")
          .select("*")
          .eq("company_id", companyId);



        if(project_id){

          query = query.eq(
            "project_id",
            project_id
          );

        }


        if(expense_category){

          query = query.eq(
            "expense_category",
            expense_category
          );

        }



        const {
          data,
          error
        } = await query;



        if(error) throw error;


        expenses = data || [];

      }
      else{


        expenses =
          mockExpenses.filter(
            e=>e.company_id === companyId
          );

      }



      return res.json({

        success:true,

        count:expenses.length,

        data:expenses

      });



    }catch(err){

      next(err);

    }

  }







  // ===============================
  // GET EXPENSE BY ID
  // ===============================

  static async getExpenseById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ){
    const companyId = req.user!.company_id;
    const { id } = req.params;

    try{
      const {
        data,
        error
      } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .eq("company_id", companyId)
        .single();

      if(error || !data){
        return res.status(404).json({
          success:false,
          message:"Expense not found"
        });
      }

      return res.json({
        success:true,
        data
      });
    }catch(err){
      next(err);
    }
  }

  // ===============================
  // CREATE EXPENSE
  // ===============================


  static async createExpense(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
  ){


    const companyId = req.user!.company_id;

    try{


      const titleValue =
        req.body.expense_title ||
        req.body.title ||
        "";


      const categoryValue =
        req.body.category ||
        req.body.expense_category ||
        "";


      const paymentValue =
        req.body.payment_method ||
        req.body.payment_mode ||
        "Cash";


      const expenseData = {


        company_id: companyId,


        project_id:
          req.body.project_id || null,


        bill_id:
          req.body.bill_id || null,


        expense_title: titleValue,
        title: titleValue,


        expense_category: categoryValue,
        category: categoryValue,


        description:
          req.body.description || req.body.expense_title || "",


        amount:
          Number(req.body.amount),


        expense_date:
          req.body.expense_date ||
          new Date().toISOString()
          .split("T")[0],


        payment_method: paymentValue,
        payment_mode: paymentValue,


        vendor:
          req.body.vendor || "",


        remarks:
          req.body.remarks || "",


        created_by:
          req.user?.id


      };



      const {
        data,
        error
      } = await supabase
        .from("expenses")
        .insert(expenseData)
        .select()
        .single();



      if(error) throw error;



      return res.status(201).json({

        success:true,

        message:"Expense created successfully",

        data

      });



    }catch(err){

      next(err);

    }

  }







  // ===============================
  // UPDATE EXPENSE
  // ===============================


  static async updateExpense(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
  ){


    const companyId = req.user!.company_id;


    const {id}=req.params;


    try{


      const allowedFields = [
        "project_id",
        "bill_id",
        "title",
        "expense_title",
        "description",
        "category",
        "expense_category",
        "amount",
        "expense_date",
        "payment_mode",
        "payment_method",
        "vendor",
        "remarks"
      ];

      const updateData: any = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      if (updateData.expense_title !== undefined) updateData.title = updateData.expense_title;
      if (updateData.title !== undefined) updateData.expense_title = updateData.title;
      if (updateData.expense_category !== undefined) updateData.category = updateData.expense_category;
      if (updateData.category !== undefined) updateData.expense_category = updateData.category;
      if (updateData.payment_method !== undefined) updateData.payment_mode = updateData.payment_method;
      if (updateData.payment_mode !== undefined) updateData.payment_method = updateData.payment_mode;

      const {
        data,
        error
      } = await supabase
        .from("expenses")
        .update({

          ...updateData,

          updated_at: new Date()
            .toISOString()

        })
        .eq("id",id)
        .eq("company_id",companyId)
        .select()
        .single();



      if(error) throw error;



      return res.json({

        success:true,

        message:"Expense updated successfully",

        data

      });



    }catch(err){

      next(err);

    }

  }







  // ===============================
  // DELETE EXPENSE
  // ===============================


  static async deleteExpense(
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
  ){


    const companyId = req.user!.company_id;


    const {id}=req.params;



    try{


      const {
        error
      } = await supabase
        .from("expenses")
        .delete()
        .eq("id",id)
        .eq("company_id",companyId);



      if(error) throw error;



      return res.json({

        success:true,

        message:"Expense deleted successfully"

      });



    }catch(err){

      next(err);

    }

  }


}


export default ExpenseController;