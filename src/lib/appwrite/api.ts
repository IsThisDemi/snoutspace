import { ID } from "appwrite";
import { INewUser } from "@/types";
import { account } from "./config";

export async function createUserAccount(user: INewUser) {
    try {
        const NewAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        )

        return NewAccount
    } catch (error) {
        console.log(error)
        return error
    }
}