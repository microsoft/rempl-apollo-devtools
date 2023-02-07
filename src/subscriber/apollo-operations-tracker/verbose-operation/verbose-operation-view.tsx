import * as React from "react";
import {
  Accordion,
  Button,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Tooltip,
  Text,
} from "@fluentui/react-components";
import {
  IVerboseOperation,
  IOperationResult,
  IVerboseOperationDuration,
} from "apollo-inspector";
import { useStyles } from "./verbose-operation-view-styles";
import { OperationVariables, WatchQueryFetchPolicy } from "@apollo/client";
import {
  getOperationName,
  isNumber,
  copyToClipboard,
} from "../apollo-operations-tracker-utils";
import { DocumentNode } from "graphql";
import { ResultsFrom } from "../../../types";

const spaceForStringify = 2;

type stylesKeys =
  | "operationView"
  | "operationNameAccPanel"
  | "operationVariablesAccPanel"
  | "durationAccPanel"
  | "fetchPolicyAccPanel"
  | "errorAccPanel"
  | "warningAccPanel"
  | "affectedQueriesAccPanel"
  | "operationDetails"
  | "operationName";

interface IVerboseOperationViewProps {
  operation: IVerboseOperation | undefined;
}

export const VerboseOperationView = (props: IVerboseOperationViewProps) => {
  const classes = useStyles();
  const { operation } = props;
  if (!operation) {
    return <></>;
  }

  const { operationType } = operation;

  const accordionItems = React.useMemo(
    () => getAccordionItems(operation, classes),
    [operation, classes],
  );

  const onCopy = useCopyOneOperation(operation);

  return (
    <div className={classes.operationView}>
      <Button
        className={classes.copyBtn}
        key={"copyBtn"}
        onClick={onCopy}
        size="small"
        shape="rounded"
        appearance="primary"
      >
        {"Copy currentOperation"}
      </Button>
      <h2 key="operationType">{operationType}</h2>
      <Accordion
        className={classes.operationDetails}
        key={"operationnViewAccordionn"}
        multiple
        collapsible
      >
        {...accordionItems}
      </Accordion>
    </div>
  );
};

const getAccordionItems = (
  operation: IVerboseOperation,
  classes: Record<stylesKeys, string>,
) => {
  const {
    operationName,
    operationString,
    result,
    variables,
    isOptimistic,
    affectedQueries,
    duration,
    fetchPolicy,
    error,
    warning,
  } = operation;
  const items = [];

  items.push(getOperationNamePanel(operationName, operationString, classes));
  items.push(getVariablesPanel(variables, classes));
  fetchPolicy && items.push(getFetchPolicyPanel(fetchPolicy, classes));
  items.push(getDurationPanel(duration, classes));
  items.push(getResultPanel(isOptimistic, result));
  error && items.push(getErrorPanel(error, classes));
  warning && items.push(getWarningPanel(warning, classes));
  items.push(
    getAffectedQueriesPanel(affectedQueries as DocumentNode[], classes),
  );

  return items;
};

const getOperationNamePanel = (
  operationName: string | undefined,
  operationString: string,
  classes: Record<stylesKeys, string>,
) => {
  return (
    <AccordionItem value="operationName">
      <AccordionHeader>{operationName}</AccordionHeader>
      <AccordionPanel>
        <div className={classes.operationNameAccPanel}>{operationString}</div>
      </AccordionPanel>
    </AccordionItem>
  );
};

const getVariablesPanel = (
  variables: OperationVariables | undefined,
  classes: Record<stylesKeys, string>,
) => (
  <AccordionItem value="variables">
    <Tooltip content={"Variables for the operation"} relationship="label">
      <AccordionHeader>{"Variables"}</AccordionHeader>
    </Tooltip>
    <AccordionPanel>
      <div className={classes.operationVariablesAccPanel}>
        {JSON.stringify(variables, null, spaceForStringify)}
      </div>
    </AccordionPanel>
  </AccordionItem>
);

const getFetchPolicyPanel = (
  fetchPolicy: WatchQueryFetchPolicy | undefined,
  classes: Record<stylesKeys, string>,
) => (
  <AccordionItem value="fetchPolicy">
    <Tooltip content={"Fetch policy of the operation"} relationship="label">
      <AccordionHeader>{"Fetch Policy"}</AccordionHeader>
    </Tooltip>
    <AccordionPanel>
      <div className={classes.fetchPolicyAccPanel}> {fetchPolicy}</div>
    </AccordionPanel>
  </AccordionItem>
);

const getAffectedQueriesPanel = (
  affectedQueries: DocumentNode[],
  classes: Record<stylesKeys, string>,
) => {
  const affectedQueriesItems = affectedQueries.map((item, index) => ({
    key: index,
    header: getOperationName(item),
  }));

  return (
    <AccordionItem value="affectedQueries">
      <Tooltip
        content={
          "Watch queries which are going to re-render due to the result of current operation"
        }
        relationship="label"
      >
        <AccordionHeader>{`Affected watch queries (${affectedQueriesItems.length})`}</AccordionHeader>
      </Tooltip>
      <AccordionPanel>
        <div className={classes.affectedQueriesAccPanel}>
          {affectedQueriesItems.map((query) => (
            <div>{query.header}</div>
          ))}
        </div>
      </AccordionPanel>
    </AccordionItem>
  );
};

const getResultPanel = (
  isOptimistic: boolean | undefined,
  result: IOperationResult[],
) => {
  const items = result.map((res) => {
    const resultFrom = getResultFromString(res.from);
    console.log({ resultFrom });

    return (
      <AccordionItem value={resultFrom}>
        <AccordionHeader>{resultFrom}</AccordionHeader>
        <AccordionPanel>
          <div> {`${JSON.stringify(res.result, null, spaceForStringify)}`}</div>
        </AccordionPanel>
      </AccordionItem>
    );
  });

  return (
    <AccordionItem value="result">
      <Tooltip
        content={
          "Data/result of the operation, whether its from cache or network"
        }
        relationship="label"
      >
        <AccordionHeader>{`Result ${
          isOptimistic ? "(Optimistic result)" : ""
        }`}</AccordionHeader>
      </Tooltip>
      <AccordionPanel>
        <Accordion collapsible>{...items}</Accordion>
      </AccordionPanel>
    </AccordionItem>
  );
};

const getResultFromString = (from: ResultsFrom) => {
  switch (from) {
    case ResultsFrom.CACHE: {
      return "CACHE";
    }
    case ResultsFrom.NETWORK: {
      return "NETWORK";
    }
  }
  return "Unknown";
};

const getErrorPanel = (error: unknown, classes: Record<stylesKeys, string>) => (
  <AccordionItem value="errorPanel">
    <Tooltip
      content={"Error message for operation failure"}
      relationship="label"
    >
      <AccordionHeader>{`Error ${error ? "(failed)" : ""}`}</AccordionHeader>
    </Tooltip>
    <AccordionPanel>
      <div className={classes.errorAccPanel}> {JSON.stringify(error)}</div>
    </AccordionPanel>
  </AccordionItem>
);

const getWarningPanel = (
  warning: unknown[],
  classes: Record<stylesKeys, string>,
) => (
  <AccordionItem value="warningPanel">
    <Tooltip
      content={
        "Show any warning like missing field error or why the result is not fetched from cache"
      }
      relationship="label"
    >
      <AccordionHeader>{`Warning`}</AccordionHeader>
    </Tooltip>
    <AccordionPanel>
      <div className={classes.warningAccPanel}> {JSON.stringify(warning)}</div>
    </AccordionPanel>
  </AccordionItem>
);

const getDurationPanel = (
  duration: IVerboseOperationDuration | undefined,
  classes: Record<stylesKeys, string>,
) => (
  <AccordionItem value="duration">
    <Tooltip
      content={"Detailed time info for operation in milliSeconds"}
      relationship="label"
    >
      <AccordionHeader>{`Duration (ms)`}</AccordionHeader>
    </Tooltip>
    <AccordionPanel>
      <div className={classes.durationAccPanel}>
        <Text key="1">{`Total execution time: ${duration?.totalTime}`}</Text>
        {isNumber(duration?.requestExecutionTime) ? (
          <Text key="2">{`Time spend to get the data from resolver: ${duration?.requestExecutionTime}`}</Text>
        ) : (
          <div />
        )}
        {isNumber(duration?.cacheWriteTime) ? (
          <Text key="3">{`Time spent to write data to cache: ${duration?.cacheWriteTime}`}</Text>
        ) : (
          <div />
        )}
        {isNumber(duration?.cacheDiffTime) ? (
          <Text key="4">{`Time spent to diff data from cache: ${duration?.cacheDiffTime}`}</Text>
        ) : (
          <div />
        )}
        {isNumber(duration?.cacheBroadcastWatchesTime) ? (
          <Text key="5">{`Time spent to broadcastWatches: ${duration?.cacheBroadcastWatchesTime}`}</Text>
        ) : (
          <div />
        )}
      </div>
    </AccordionPanel>
  </AccordionItem>
);

const useCopyOneOperation = (operation: IVerboseOperation) => {
  const {
    operationName,
    operationString,
    operationType,
    result,
    variables,
    isOptimistic,
    affectedQueries,
    duration,
    fetchPolicy,
    error,
    warning,
  } = operation;
  const onCopy = React.useCallback(async () => {
    const objToCopy = {
      operationName,
      operationString,
      operationType,
      result,
      variables,
      isOptimistic,
      duration,
      fetchPolicy,
      error,
      warning,
      affectedQueries: affectedQueries.map((item) => getOperationName(item)),
    };
    await copyToClipboard(objToCopy);
  }, [
    operationName,
    operationString,
    operationType,
    result,
    variables,
    isOptimistic,
    affectedQueries,
    duration,
    fetchPolicy,
    error,
    warning,
  ]);
  return onCopy;
};