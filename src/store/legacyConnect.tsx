import React, { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, stateType } from "./useAppStore";

export function connect(
  mapState: ((state: stateType) => Record<string, any>) | null,
  actions?: Record<string, any> | null
): any {
  return (Component: React.ComponentType<any>) => {
    function Connected(props: any) {
      const selector = mapState ?? (() => ({}));
      const mapped = useAppStore(useShallow(selector as any));
      const bound = useMemo(() => {
        if (!actions) return {};
        const out: Record<string, (...args: any[]) => any> = {};
        for (const key of Object.keys(actions)) {
          out[key] = (...args: any[]) =>
            (useAppStore.getState() as any)[key](...args);
        }
        return out;
      }, []);
      return <Component {...props} {...(mapped as any)} {...bound} />;
    }
    return Connected;
  };
}
