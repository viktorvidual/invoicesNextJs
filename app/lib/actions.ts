"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.string(),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({
  id: true,
  date: true,
});

export async function createInvoice(formData: FormData) {
  console.log("Creating invoice...");

  try {
    const { customerId, amount, status } = CreateInvoice.parse({
      customerId: formData.get("customerId"),
      amount: formData.get("amount"),
      status: formData.get("status"),
    });

    const amountToCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];
    await sql`
      INSERT INTO invoices(customer_id, amount, status, date)
      VALUES (${customerId}, ${amountToCents}, ${status}, ${date})
      `;
  } catch (e) {
    return { message: "Failed to create invoice" };
  }

  console.log("Invoice created!");

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  try {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get("customerId"),
      amount: formData.get("amount"),
      status: formData.get("status"),
    });

    const amountInCents = amount * 100;
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (e) {
    return { message: "Failed to update invoice" };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`
          DELETE FROM invoices
          WHERE id = ${id}
        `;
  } catch (e) {
    return { message: "Failed to delete invoice" };
  }
  revalidatePath("/dashboard/invoices");
}
