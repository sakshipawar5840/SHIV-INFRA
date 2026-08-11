// =====================================================
// SHIVINFRA EXPENSE SERVICE V17
// PRODUCTION AI ERP EXPENSE ENGINE
//
// FEATURES
// -----------------------------------------------------
// CREATE EXPENSE
// AI CREATE SUPPORT
// SEARCH EXPENSES
// GET ALL EXPENSES
// GET BY ID
// UPDATE EXPENSE
// DELETE EXPENSE
// COMPANY ISOLATION
// FIELD WHITELIST
// AI FRIENDLY DATA MAPPING
//
// DATABASE: SUPABASE
// =====================================================

import { supabaseAdmin as supabase } from "../config/supabase.ts";


// =====================================================
// TYPES
// =====================================================

export interface ExpenseCreateInput {

  company_id: string;

  project_id?: string | null;

  bill_id?: string | null;

  title?: string;

  expense_title?: string;

  description?: string;

  category?: string;

  expense_category?: string;

  amount?: number | string;

  expense_date?: string;

  payment_mode?: string;

  payment_method?: string;

  vendor?: string;

  remarks?: string;

  created_by?: string;

  [key: string]: any;
}


export interface ExpenseUpdateInput {

  project_id?: string | null;

  bill_id?: string | null;

  title?: string;

  expense_title?: string;

  description?: string;

  category?: string;

  expense_category?: string;

  amount?: number | string;

  expense_date?: string;

  payment_mode?: string;

  payment_method?: string;

  vendor?: string;

  remarks?: string;

  created_by?: string;

  [key: string]: any;
}


// =====================================================
// SERVICE CLASS
// =====================================================

class ExpenseService {


  // ===================================================
  // LOGGER
  // ===================================================

  private log(
    action: string,
    data: any = {}
  ) {

    console.log(
      "[SHIVINFRA EXPENSE SERVICE V17]",
      action,
      {
        timestamp: new Date().toISOString(),
        ...data
      }
    );

  }


  // ===================================================
  // CLEAN TEXT
  // ===================================================

  private cleanText(
    value: any
  ): string {

    return String(value ?? "")
      .trim();

  }


  // ===================================================
  // PARSE NUMBER
  //
  // Supports:
  // 25000
  // "25000"
  // "25,000"
  // "25 lakh"
  // "2 crore"
  // ===================================================

  private parseNumber(
    value: any
  ): number | null {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {

      return null;

    }


    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {

      return value;

    }


    const text =
      String(value)
        .toLowerCase()
        .trim();


    let multiplier = 1;


    if (
      text.includes("crore") ||
      text.includes("crores") ||
      text.includes("cr")
    ) {

      multiplier = 10000000;

    }

    else if (
      text.includes("lakh") ||
      text.includes("lakhs") ||
      text.includes("lac")
    ) {

      multiplier = 100000;

    }


    const cleaned =
      text.replace(
        /[^0-9.]/g,
        ""
      );


    const number =
      Number(cleaned);


    if (
      !Number.isFinite(number)
    ) {

      return null;

    }


    return number * multiplier;

  }


  // ===================================================
  // NORMALIZE CATEGORY
  // ===================================================

  private normalizeCategory(
    value: any
  ): string | null {

    const category =
      this.cleanText(value);


    if (!category) {

      return null;

    }


    return category;

  }


  // ===================================================
  // NORMALIZE PAYMENT MODE
  //
  // CASH
  // UPI
  // BANK
  // CARD
  // CHEQUE
  // ONLINE
  // ===================================================

  private normalizePaymentMode(
    value: any
  ): string | null {

    const text =
      this.cleanText(value)
        .toUpperCase();


    if (!text) {

      return null;

    }


    if (
      text === "CASH"
    ) {

      return "CASH";

    }


    if (
      text === "UPI"
    ) {

      return "UPI";

    }


    if (
      text === "BANK" ||
      text === "BANK TRANSFER" ||
      text === "BANK_TRANSFER"
    ) {

      return "BANK";

    }


    if (
      text === "CARD" ||
      text === "CREDIT CARD" ||
      text === "DEBIT CARD"
    ) {

      return "CARD";

    }


    if (
      text === "CHEQUE" ||
      text === "CHECK"
    ) {

      return "CHEQUE";

    }


    if (
      text === "ONLINE"
    ) {

      return "ONLINE";

    }


    return text;

  }


  // ===================================================
  // NORMALIZE DATE
  // ===================================================

  private normalizeDate(
    value: any
  ): string {

    if (!value) {

      return new Date()
        .toISOString()
        .slice(0, 10);

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return new Date()
        .toISOString()
        .slice(0, 10);

    }


    return date
      .toISOString()
      .slice(0, 10);

  }


  // ===================================================
  // PREPARE CREATE DATA
  //
  // IMPORTANT:
  // DO NOT SPREAD RAW AI OBJECT INTO DATABASE
  // ===================================================

  private prepareCreateData(
    expense: ExpenseCreateInput
  ) {

    const title =
      this.cleanText(
        expense.title ||
        expense.expense_title
      );


    const category =
      this.normalizeCategory(
        expense.category ||
        expense.expense_category
      );


    const paymentMode =
      this.normalizePaymentMode(
        expense.payment_mode ||
        expense.payment_method
      );


    const amount =
      this.parseNumber(
        expense.amount
      );


    const description =
      this.cleanText(
        expense.description
      );


    const vendor =
      this.cleanText(
        expense.vendor
      );


    const remarks =
      this.cleanText(
        expense.remarks
      );


    const now =
      new Date().toISOString();


    return {

      // ---------------------------------------------
      // REQUIRED COMPANY
      // ---------------------------------------------

      company_id:
        expense.company_id,


      // ---------------------------------------------
      // RELATIONS
      // ---------------------------------------------

      project_id:
        expense.project_id ||
        null,


      bill_id:
        expense.bill_id ||
        null,


      // ---------------------------------------------
      // CANONICAL EXPENSE COLUMNS
      // ---------------------------------------------

      expense_title:
        title || null,


      expense_category:
        category || null,


      amount:
        amount,


      expense_date:
        this.normalizeDate(
          expense.expense_date
        ),


      payment_method:
        paymentMode || null,


      remarks:
        remarks || null,


      created_by:
        expense.created_by ||
        null,


      // ---------------------------------------------
      // COMPATIBILITY COLUMNS
      // Based on your current Supabase response
      // ---------------------------------------------

      title:
        title || null,


      category:
        category || null,


      description:
        description,


      payment_mode:
        paymentMode || null,


      vendor:
        vendor,


      // ---------------------------------------------
      // TIMESTAMPS
      // ---------------------------------------------

      created_at:
        now,


      updated_at:
        now

    };

  }


  // ===================================================
  // PREPARE UPDATE DATA
  // ===================================================

  private prepareUpdateData(
    updateData: ExpenseUpdateInput
  ) {

    const clean: any = {};


    // -----------------------------------------------
    // PROJECT
    // -----------------------------------------------

    if (
      updateData.project_id !== undefined
    ) {

      clean.project_id =
        updateData.project_id ||
        null;

    }


    // -----------------------------------------------
    // BILL
    // -----------------------------------------------

    if (
      updateData.bill_id !== undefined
    ) {

      clean.bill_id =
        updateData.bill_id ||
        null;

    }


    // -----------------------------------------------
    // TITLE
    // -----------------------------------------------

    if (
      updateData.title !== undefined ||
      updateData.expense_title !== undefined
    ) {

      const title =
        this.cleanText(
          updateData.title ||
          updateData.expense_title
        );


      clean.title =
        title || null;


      clean.expense_title =
        title || null;

    }


    // -----------------------------------------------
    // DESCRIPTION
    // -----------------------------------------------

    if (
      updateData.description !== undefined
    ) {

      clean.description =
        this.cleanText(
          updateData.description
        );

    }


    // -----------------------------------------------
    // CATEGORY
    // -----------------------------------------------

    if (
      updateData.category !== undefined ||
      updateData.expense_category !== undefined
    ) {

      const category =
        this.normalizeCategory(
          updateData.category ||
          updateData.expense_category
        );


      clean.category =
        category;


      clean.expense_category =
        category;

    }


    // -----------------------------------------------
    // AMOUNT
    // -----------------------------------------------

    if (
      updateData.amount !== undefined
    ) {

      clean.amount =
        this.parseNumber(
          updateData.amount
        );

    }


    // -----------------------------------------------
    // DATE
    // -----------------------------------------------

    if (
      updateData.expense_date !== undefined
    ) {

      clean.expense_date =
        this.normalizeDate(
          updateData.expense_date
        );

    }


    // -----------------------------------------------
    // PAYMENT MODE
    // -----------------------------------------------

    if (
      updateData.payment_mode !== undefined ||
      updateData.payment_method !== undefined
    ) {

      const paymentMode =
        this.normalizePaymentMode(
          updateData.payment_mode ||
          updateData.payment_method
        );


      clean.payment_mode =
        paymentMode;


      clean.payment_method =
        paymentMode;

    }


    // -----------------------------------------------
    // VENDOR
    // -----------------------------------------------

    if (
      updateData.vendor !== undefined
    ) {

      clean.vendor =
        this.cleanText(
          updateData.vendor
        );

    }


    // -----------------------------------------------
    // REMARKS
    // -----------------------------------------------

    if (
      updateData.remarks !== undefined
    ) {

      clean.remarks =
        this.cleanText(
          updateData.remarks
        );

    }


    // -----------------------------------------------
    // CREATED BY
    // -----------------------------------------------

    if (
      updateData.created_by !== undefined
    ) {

      clean.created_by =
        updateData.created_by ||
        null;

    }


    // -----------------------------------------------
    // UPDATED
    // -----------------------------------------------

    clean.updated_at =
      new Date().toISOString();


    return clean;

  }


  // ===================================================
  // CREATE EXPENSE
  //
  // AI + API READY
  // ===================================================

  async createExpense(
    expense: ExpenseCreateInput
  ) {

    try {

      if (
        !expense.company_id
      ) {

        throw new Error(
          "Company ID required"
        );

      }


      const insertData =
        this.prepareCreateData(
          expense
        );


      if (
        insertData.amount === null
      ) {

        throw new Error(
          "Expense amount required"
        );

      }


      this.log(
        "CREATE EXPENSE",
        {
          company_id:
            expense.company_id,

          title:
            insertData.expense_title,

          amount:
            insertData.amount,

          category:
            insertData.expense_category
        }
      );


      const {
        data,
        error
      } =
        await supabase

          .from("expenses")

          .insert(
            insertData
          )

          .select()

          .single();


      if (error) {

        console.error(
          "CREATE EXPENSE ERROR:",
          error
        );

        throw error;

      }


      return data;

    }

    catch (error: any) {

      console.error(
        "EXPENSE CREATE FAILED:",
        error?.message ||
        error
      );

      throw error;

    }

  }


  // ===================================================
  // AI CREATE EXPENSE
  //
  // Converts Gemini/AI parameters
  // ===================================================

  async aiCreateExpense(
    companyId: string,
    params: any = {}
  ) {

    const title =
      params.title ||
      params.expense_title ||
      params.name ||
      "";


    const category =
      params.category ||
      params.expense_category ||
      "General";


    const amount =
      params.amount ||
      params.price ||
      params.cost ||
      null;


    const paymentMode =
      params.payment_mode ||
      params.paymentMethod ||
      params.payment_method ||
      "";


    const vendor =
      params.vendor ||
      "";


    const description =
      params.description ||
      "";


    const remarks =
      params.remarks ||
      "";


    return this.createExpense({

      company_id:
        companyId,

      project_id:
        params.project_id ||
        null,

      bill_id:
        params.bill_id ||
        null,

      title,

      category,

      amount,

      expense_date:
        params.expense_date ||
        params.date ||
        undefined,

      payment_mode:
        paymentMode,

      vendor,

      description,

      remarks,

      created_by:
        params.created_by ||
        null

    });

  }


  // ===================================================
  // AI SEARCH EXPENSES
  // ===================================================

  async aiSearchExpenses(

    companyId: string,

    params: any = {}

  ) {

    try {

      if (!companyId) {

        throw new Error(
          "Company ID required"
        );

      }


      let query: any =

        supabase

          .from("expenses")

          .select("*")

          .eq(
            "company_id",
            companyId
          )

          .order(
            "created_at",
            {
              ascending: false
            }
          );


      const search =
        this.cleanText(
          params.query ||
          params.message ||
          params.text
        );


      if (search) {

        query =
          query.or(

            [

              `expense_title.ilike.%${search}%`,

              `expense_category.ilike.%${search}%`,

              `payment_method.ilike.%${search}%`,

              `remarks.ilike.%${search}%`,

              `title.ilike.%${search}%`,

              `category.ilike.%${search}%`,

              `description.ilike.%${search}%`,

              `payment_mode.ilike.%${search}%`,

              `vendor.ilike.%${search}%`

            ].join(",")

          );

      }


      const category =
        params.category ||
        params.expense_category;


      if (category) {

        query =
          query.or(

            `expense_category.ilike.%${category}%,category.ilike.%${category}%`

          );

      }


      if (
        params.project_id
      ) {

        query =
          query.eq(
            "project_id",
            params.project_id
          );

      }


      if (
        params.payment_mode ||
        params.payment_method
      ) {

        const paymentMode =
          this.normalizePaymentMode(

            params.payment_mode ||
            params.payment_method

          );


        query =
          query.or(

            `payment_mode.eq.${paymentMode},payment_method.eq.${paymentMode}`

          );

      }


      const {
        data,
        error
      } = await query;


      if (error) {

        throw error;

      }


      return data || [];

    }

    catch (error: any) {

      console.error(
        "AI SEARCH EXPENSE ERROR:",
        error?.message ||
        error
      );

      throw error;

    }

  }


  // ===================================================
  // OLD SEARCH SUPPORT
  // ===================================================

  async searchExpenses(

    companyId: string,

    queryText: string = ""

  ) {

    return this.aiSearchExpenses(

      companyId,

      {
        query:
          queryText
      }

    );

  }


  // ===================================================
  // GET ALL EXPENSES
  // ===================================================

  async getExpenses(

    companyId: string

  ) {

    if (!companyId) {

      throw new Error(
        "Company ID required"
      );

    }


    const {
      data,
      error
    } =

      await supabase

        .from("expenses")

        .select("*")

        .eq(
          "company_id",
          companyId
        )

        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    return data || [];

  }


  // ===================================================
  // GET EXPENSE BY ID
  // ===================================================

  async getExpenseById(

    id: string,

    companyId: string

  ) {

    if (
      !id ||
      !companyId
    ) {

      throw new Error(
        "Expense ID and Company ID required"
      );

    }


    const {
      data,
      error
    } =

      await supabase

        .from("expenses")

        .select("*")

        .eq(
          "id",
          id
        )

        .eq(
          "company_id",
          companyId
        )

        .maybeSingle();


    if (error) {

      throw error;

    }


    if (!data) {

      throw new Error(
        "Expense not found"
      );

    }


    return data;

  }


  // ===================================================
  // UPDATE EXPENSE
  // ===================================================

  async updateExpense(

    id: string,

    companyId: string,

    updateData: ExpenseUpdateInput

  ) {

    if (
      !id ||
      !companyId
    ) {

      throw new Error(
        "Expense ID and Company ID required"
      );

    }


    const cleanData =
      this.prepareUpdateData(
        updateData
      );


    if (
      Object.keys(cleanData).length <= 1
    ) {

      throw new Error(
        "No update fields provided"
      );

    }


    const {
      data,
      error
    } =

      await supabase

        .from("expenses")

        .update(
          cleanData
        )

        .eq(
          "id",
          id
        )

        .eq(
          "company_id",
          companyId
        )

        .select()

        .single();


    if (error) {

      console.error(
        "UPDATE EXPENSE ERROR:",
        error.message
      );

      throw error;

    }


    return data;

  }


  // ===================================================
  // AI UPDATE EXPENSE
  // ===================================================

  async aiUpdateExpense(

    companyId: string,

    expenseId: string,

    params: any = {}

  ) {

    return this.updateExpense(

      expenseId,

      companyId,

      params

    );

  }


  // ===================================================
  // DELETE EXPENSE
  //
  // CURRENTLY HARD DELETE
  // ===================================================

  async deleteExpense(

    id: string,

    companyId: string

  ) {

    if (
      !id ||
      !companyId
    ) {

      throw new Error(
        "Expense ID and Company ID required"
      );

    }


    const {
      error
    } =

      await supabase

        .from("expenses")

        .delete()

        .eq(
          "id",
          id
        )

        .eq(
          "company_id",
          companyId
        );


    if (error) {

      throw error;

    }


    return true;

  }


  // ===================================================
  // EXPENSE SUMMARY
  // ===================================================

  async expenseSummary(

    companyId: string

  ) {

    const expenses =
      await this.getExpenses(
        companyId
      );


    const total =
      expenses.reduce(

        (
          sum: number,
          expense: any
        ) =>

          sum +
          Number(
            expense.amount || 0
          ),

        0

      );


    const byCategory: any = {};


    expenses.forEach(
      (expense: any) => {

        const category =
          expense.category ||
          expense.expense_category ||
          "General";


        if (
          !byCategory[category]
        ) {

          byCategory[category] = 0;

        }


        byCategory[category] +=
          Number(
            expense.amount || 0
          );

      }
    );


    return {

      total_expenses:
        expenses.length,

      total_amount:
        total,

      by_category:
        byCategory,

      generated_at:
        new Date()

    };

  }


  // ===================================================
  // HEALTH
  // ===================================================

  health() {

    return {

      service:
        "SHIVINFRA EXPENSE SERVICE",

      version:
        "V17",

      status:
        "RUNNING",

      database:
        "SUPABASE",

      ai_ready:
        true,

      crud:
        true,

      timestamp:
        new Date()

    };

  }

}


// =====================================================
// EXPORT
// =====================================================

export default new ExpenseService();