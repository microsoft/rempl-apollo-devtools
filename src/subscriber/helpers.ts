import { print } from "graphql/language/printer";
import {
  WatchedQuery,
  Mutation as MutationType,
  ApolloTrackerContextData,
} from "./types";
import { getOperationName } from "@apollo/client/utilities";
import { ApolloTrackerData } from "../types";

function getQueryData(query: any, key: number): WatchedQuery | undefined {
  if (!query || !query.document) return;
  // TODO: The current designs do not account for non-cached data.
  // We need a workaround to show that data + we should surface
  // the FetchPolicy.
  const name = getOperationName(query?.document) || "";
  if (name === "IntrospectionQuery") {
    return;
  }

  return {
    id: key,
    typename: "WatchedQuery",
    name,
    queryString: print(query.document),
    variables: query.variables,
    cachedData: query.cachedData,
  };
}

function getMutationData(mutation: any, key: number): MutationType | undefined {
  if (!mutation) return;

  return {
    id: key,
    typename: "Mutation",
    name: getOperationName(mutation.mutation) || "",
    mutationString: print(mutation.mutation),
    variables: mutation.variables,
    errorMessage: mutation.errorMessage,
  };
}

const getData = ({
  queries,
  mutations,
}: {
  mutations: unknown[];
  queries: unknown[];
}) => {
  const filteredQueries: WatchedQuery[] = Object.values(queries || {})
    .map((q, i: number) => getQueryData(q, i))
    .filter(Boolean) as WatchedQuery[];

  const watchedQueries = {
    queries: filteredQueries,
    count: filteredQueries.length,
  };

  const mappedMutations: MutationType[] = Object.values(mutations || {})
    .map((m, i: number) => getMutationData(m, i))
    .filter(Boolean) as MutationType[];

  const mutationLog = {
    mutations: mappedMutations,
    count: mappedMutations.length,
  };

  return { mutationLog, watchedQueries };
};

export function updateData(
  apolloTrackerData: ApolloTrackerData,
  setApolloTrackerContextData: (
    apolloTrackerContextData: ApolloTrackerContextData
  ) => void
) {
  setApolloTrackerContextData(
    Object.entries(apolloTrackerData).reduce((acc, [key, value]) => {
      acc[key] = getData(value);

      return acc;
    }, {} as ApolloTrackerContextData)
  );
}
