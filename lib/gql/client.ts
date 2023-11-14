import { GraphQLClient, Variables } from "graphql-request";
import { dealWithError } from "../error/error-management";

class ClientWrapper {
    graphqlClient: GraphQLClient;

    constructor(graphqlClient: GraphQLClient) {
        this.graphqlClient = graphqlClient;
    }

    request<T = any, V extends Variables = Variables>(query: string, params: V): Promise<T> {
        return this.graphqlClient.request(query, params as Variables)
            .catch((error) => {
                dealWithError(error)
            })
    }

    unsafeRequest<T = any, V extends Variables = Variables>(query: string, params: V): Promise<T> {
        return this.graphqlClient.request(query, params as Variables)
            .catch((error) => {
                dealWithError(error)
                throw error
            })
    }

    SWRRequest<T = any, V extends Variables = Variables>(query: string, params: V): Promise<T> {
        return this.graphqlClient.request(query, params as Variables)
    }
}

export const client = new ClientWrapper(new GraphQLClient("/api/graphql"))

export const fetcher = (params: any | any[]) => {
    let query;
    let variables;

    if (Array.isArray(params)) {
        [query, variables] = params
    } else {
        query = params;
    }
    return client.SWRRequest(query, variables)
} 

