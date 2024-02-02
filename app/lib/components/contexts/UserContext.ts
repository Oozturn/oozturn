import { createContext } from "react";
import { User } from "~/lib/persistence/users.server";


export const UserContext = createContext<User | undefined>(undefined);