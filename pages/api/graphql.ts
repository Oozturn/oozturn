import { createYoga, createSchema, YogaInitialContext } from 'graphql-yoga'
import { readFileSync } from 'fs'
import { join } from 'path'
import { resolvers } from '../../lib/gql/resolvers'
import { withIronSessionApiRoute } from "iron-session/next";
import { ironOptions } from '../../lib/session/config';
import { withLogger } from '../../lib/logging/logging';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '1mb',
  }
};

const typeDefs = readFileSync(join(process.cwd(),"lib/gql/schema.graphql"), {
  encoding: "utf-8"
})

const schema = createSchema({
  typeDefs,
  resolvers,
})

const yoga = createYoga({
  schema,
  // Needed to be defined explicitly because our endpoint lives at a different path other than `/graphql`
  graphqlEndpoint: '/api/graphql'
})

const loggerMiddleware =  withLogger(yoga)
const ironSessionMiddleware = withIronSessionApiRoute(loggerMiddleware, ironOptions)
export default ironSessionMiddleware