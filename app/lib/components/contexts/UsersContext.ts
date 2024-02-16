import { createContext } from "react";
import { User } from "~/lib/types/user";


export const UsersContext = createContext<User[] | undefined>(undefined);