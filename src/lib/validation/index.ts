import * as z from "zod";

export const SignupValidation = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  username: z
    .string()
    .min(6, { message: "Username must be at least 6 characters" })
    .max(50, { message: "Username must be less than 50 characters" }),
  email: z.string().email({ message: "Invalid email" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(50, { message: "Password must be less than 50 characters" }),
});

export const SigninValidation = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(50, { message: "Password must be less than 50 characters" }),
});

export const PostValidation = z.object({
  caption: z
    .string()
    .min(5, { message: "Caption must be at least 5 character" })
    .max(2200, { message: "Caption must be less than 2200 character" }),
  file: z.custom<File[]>(),
  location: z
  .string()
  .min(5, { message: "Location must be at least 5 character" })
  .max(100, { message: "Location must be less than 100 character" }),
  tags: z.string(),
});
