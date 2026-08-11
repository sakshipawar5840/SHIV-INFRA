import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/whatsapp/WhatsappWebhookService.ts';
let content = fs.readFileSync(path, 'utf8');

const oldMethod = `    private async resolveUserContext(
        phone: string
    ): Promise<WhatsAppUserContext | null> {

        try {

            const normalizedPhone =
                String(
                    phone || ""
                ).trim();


            if (!normalizedPhone) {

                return null;

            }


            const companyId =
                String(
                    process.env.DEFAULT_COMPANY_ID
                    || ""
                ).trim();


            if (!companyId) {

                console.error(
                    "❌ DEFAULT_COMPANY_ID missing"
                );

                return null;

            }


            // -----------------------------------------
            // SEARCH CUSTOMER
            // -----------------------------------------

            const customers =
                await customerService.aiSearchCustomers(

                    companyId,

                    {

                        query:
                            normalizedPhone

                    }

                );


            if (
                Array.isArray(customers)
                &&
                customers.length > 0
            ) {

                const customer =
                    customers[0];


                const customerCompanyId =
                    String(
                        customer?.company_id
                        || companyId
                    ).trim();


                if (
                    customerCompanyId !== companyId
                ) {

                    console.warn(
                        "⚠️ CUSTOMER COMPANY MISMATCH",
                        {

                            phone:
                                normalizedPhone,

                            expected_company:
                                companyId,

                            customer_company:
                                customerCompanyId

                        }
                    );


                    return null;

                }


                return {

                    id:
                        customer?.id
                        || undefined,

                    company_id:
                        customerCompanyId,

                    role:
                        "CUSTOMER",

                    channel:
                        "WHATSAPP"

                };

            }


            // -----------------------------------------
            // OPTIONAL UNREGISTERED MODE
            // -----------------------------------------

            const allowUnregistered =
                String(
                    process.env
                        .WHATSAPP_ALLOW_UNREGISTERED
                    || ""
                )
                    .trim()
                    .toLowerCase() === "true";


            if (
                allowUnregistered
            ) {

                return {

                    company_id:
                        companyId,

                    role:
                        "CUSTOMER",

                    channel:
                        "WHATSAPP"

                };

            }


            return null;

        }
        catch (error) {

            console.error(

                "❌ USER CONTEXT ERROR",

                this.normalizeError(error)

            );


            return null;

        }

    }`;

const newMethod = `    private async resolveUserContext(
        phone: string
    ): Promise<WhatsAppUserContext | null> {

        try {

            const normalizedPhone =
                String(
                    phone || ""
                ).trim();


            if (!normalizedPhone) {

                return null;

            }


            const companyId =
                String(
                    process.env.DEFAULT_COMPANY_ID
                    || ""
                ).trim();


            if (!companyId) {

                console.error(
                    "❌ DEFAULT_COMPANY_ID missing"
                );

                return null;

            }


            // -----------------------------------------
            // SEARCH REGISTERED USER (ADMIN / ENGINEER)
            // -----------------------------------------

            const { data: user, error: userError } =
                await supabase
                    .from("users")
                    .select("id, company_id, role, status")
                    .eq("phone", normalizedPhone)
                    .eq("company_id", companyId)
                    .maybeSingle();


            if (user && !userError) {

                const userRole =
                    String(user.role || "CUSTOMER")
                    .trim()
                    .toUpperCase();


                if (
                    userRole === "ADMIN" ||
                    userRole === "SUPER ADMIN" ||
                    userRole === "ENGINEER" ||
                    userRole === "SALES MANAGER"
                ) {

                    return {

                        id: user.id,

                        company_id: user.company_id,

                        role: userRole,

                        channel: "WHATSAPP"

                    };

                }

            }


            // -----------------------------------------
            // SEARCH CUSTOMER
            // -----------------------------------------

            const customers =
                await customerService.aiSearchCustomers(

                    companyId,

                    {

                        query:
                            normalizedPhone

                    }

                );


            if (
                Array.isArray(customers)
                &&
                customers.length > 0
            ) {

                const customer =
                    customers[0];


                const customerCompanyId =
                    String(
                        customer?.company_id
                        || companyId
                    ).trim();


                if (
                    customerCompanyId !== companyId
                ) {

                    console.warn(
                        "⚠️ CUSTOMER COMPANY MISMATCH",
                        {

                            phone:
                                normalizedPhone,

                            expected_company:
                                companyId,

                            customer_company:
                                customerCompanyId

                        }
                    );


                    return null;

                }


                return {

                    id:
                        customer?.id
                        || undefined,

                    company_id:
                        customerCompanyId,

                    role:
                        "CUSTOMER",

                    channel:
                        "WHATSAPP"

                };

            }


            // -----------------------------------------
            // OPTIONAL UNREGISTERED MODE
            // -----------------------------------------

            const allowUnregistered =
                String(
                    process.env
                        .WHATSAPP_ALLOW_UNREGISTERED
                    || ""
                )
                    .trim()
                    .toLowerCase() === "true";


            if (
                allowUnregistered
            ) {

                return {

                    company_id:
                        companyId,

                    role:
                        "CUSTOMER",

                    channel:
                        "WHATSAPP"

                };

            }


            return null;

        }
        catch (error) {

            console.error(

                "❌ USER CONTEXT ERROR",

                this.normalizeError(error)

            );


            return null;

        }

    }`;

content = content.replace(oldMethod, newMethod);
fs.writeFileSync(path, content);
console.log('Updated resolveUserContext to check users table');
