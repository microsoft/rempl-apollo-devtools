import React, { useCallback } from "react";
import { CacheObjectWithSize } from "./types";
import { ApolloCacheItems } from "./apollo-cache-items";
import debounce from "lodash.debounce";
import { useStyles } from "./apollo-cache-renderer.styles";
import {
  Text,
  Tooltip,
  Button,
  mergeClasses,
} from "@fluentui/react-components";
import { TabMenu, Search } from "../../components";
import {
  Record20Regular,
  RecordStop20Regular,
  DismissCircle20Regular,
  ArrowClockwise20Regular,
} from "@fluentui/react-icons";
import { ApolloCacheDuplicatedItems } from "./apollo-cache-duplicated-items";
import { CacheDuplicates } from "../../types";

interface IApolloCacheRenderer {
  cacheObjectsWithSize: CacheObjectWithSize[];
  recentCacheWithSize: CacheObjectWithSize[];
  duplicatedCacheObjects: CacheDuplicates;
  recordRecentCacheChanges: (shouldRemove: boolean) => void;
  clearRecentCacheChanges: () => void;
  getCacheDuplicates: () => void;
  removeCacheItem: (key: string) => void;
  cacheSize: number;
}

function filterCacheObjects(
  cacheObjectsWithSize: CacheObjectWithSize[],
  searchKey: string
) {
  if (!searchKey) return cacheObjectsWithSize;

  return cacheObjectsWithSize.filter(({ key }: CacheObjectWithSize) =>
    key.toLowerCase().includes(searchKey.toLowerCase())
  );
}

export const ApolloCacheRenderer = React.memo(
  ({
    cacheObjectsWithSize,
    recentCacheWithSize,
    duplicatedCacheObjects,
    getCacheDuplicates,
    cacheSize,
    removeCacheItem,
    recordRecentCacheChanges,
    clearRecentCacheChanges,
  }: IApolloCacheRenderer) => {
    const [searchKey, setSearchKey] = React.useState("");
    const [currentCache, setCurrentCache] = React.useState("all");
    const [recordRecentCache, setRecordRecentCache] = React.useState(false);
    const classes = useStyles();

    const getCurrentCacheView = useCallback((cacheType: string) => {
      if (cacheType === "duplicated") {
        getCacheDuplicates();
      }
      setCurrentCache(cacheType);
    }, []);

    const toggleRecordRecentChanges = useCallback(() => {
      recordRecentCacheChanges(!recordRecentCache);
      setRecordRecentCache(!recordRecentCache);
    }, [recordRecentCache]);

    const debouncedSetSearchKey = useCallback(
      debounce((searchKey: string) => setSearchKey(searchKey), 250),
      [setSearchKey]
    );

    const convertDuplicatedObjects = (data: CacheDuplicates) => {
      return data.map((item) => item.map((obj) => Object.values(obj)[0]));
    };

    return (
      <div className={classes.root}>
        <div className={classes.innerContainer}>
          <div className={classes.topBar}>
            {/* Title */}
            <Text className={classes.title} weight="semibold" size={400}>
              {`${currentCache} cache`}
            </Text>

            <div className={classes.actionsContainer}>
              {/* Recent actions */}
              {currentCache === "recent" && (
                <div className={classes.topBarActions}>
                  <Tooltip
                    content={recordRecentCache ? "Stop recording" : "Record"}
                    relationship="description"
                  >
                    <Button
                      className={mergeClasses(
                        classes.actionButton,
                        recordRecentCache && classes.activeRecord
                      )}
                      onClick={toggleRecordRecentChanges}
                    >
                      {recordRecentCache ? (
                        <RecordStop20Regular />
                      ) : (
                        <Record20Regular />
                      )}
                    </Button>
                  </Tooltip>
                  <Tooltip content="Clear" relationship="description">
                    <Button
                      className={classes.actionButton}
                      disabled={recordRecentCache}
                      onClick={clearRecentCacheChanges}
                    >
                      <DismissCircle20Regular />
                    </Button>
                  </Tooltip>
                </div>
              )}

              {currentCache === "duplicated" && (
                <div className={classes.topBarActions}>
                  <Tooltip content="Refresh" relationship="description">
                    <Button
                      className={classes.actionButton}
                      onClick={getCacheDuplicates}
                    >
                      <ArrowClockwise20Regular />
                    </Button>
                  </Tooltip>
                </div>
              )}

              {/* Search */}
              <div className={classes.searchContainer}>
                <Search
                  onSearchChange={(e: React.SyntheticEvent) => {
                    const input = e.target as HTMLInputElement;
                    debouncedSetSearchKey(input.value);
                  }}
                />
              </div>
            </div>
          </div>
          <TabMenu
            currentType={currentCache}
            onSelectItem={getCurrentCacheView}
          />

          {currentCache !== "duplicated" ? (
            <ApolloCacheItems
              cacheObjectsWithSize={
                currentCache === "recent"
                  ? recentCacheWithSize
                  : filterCacheObjects(cacheObjectsWithSize, searchKey)
              }
              removeCacheItem={removeCacheItem}
            />
          ) : null}
          {currentCache === "duplicated" ? (
            <ApolloCacheDuplicatedItems
              duplicatedCacheObjects={convertDuplicatedObjects(
                duplicatedCacheObjects
              )}
            />
          ) : null}
        </div>
        <Text className={classes.infoPanel}>
          {`Apollo cache (overall size ${cacheSize} B)`}
        </Text>
      </div>
    );
  }
);
