import React from "react";

const useIsomorphicLayoutEffect =
  typeof document !== "undefined"
    ? React.useLayoutEffect
    : React.useEffect;

const useSafeInsertionEffect: typeof useIsomorphicLayoutEffect =
  React.useInsertionEffect ?? useIsomorphicLayoutEffect;

type ChangeHandler<T> = (value: T) => void;
type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

interface UseControllableStateOptions<T> {
    value?: T;

    defaultValue: T;

    onChange?: ChangeHandler<T>;
}

interface UseUncontrolledStateOptions<T> {
  defaultValue: T;
  onChange: ChangeHandler<T>;
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, SetState<T>] {
    const handleChange = React.useCallback<ChangeHandler<T>>(
    (value) => {
      onChange?.(value);
    },
    [onChange]
  );

  const [internalValue, setInternalValue, onChangeRef] =
    useUncontrolledState({
      defaultValue,
      onChange: handleChange,
    });

    const isControlled = value !== undefined;

    const currentValue = isControlled ? value : internalValue;

  const setValue = React.useCallback<SetState<T>>(
    (next) => {
      const resolved =
        typeof next === "function"
          ? (next as (previous: T) => T)(currentValue)
          : next;

      if (isControlled) {
                if (!Object.is(resolved, currentValue)) {
          onChangeRef.current(resolved);
        }

        return;
      }

            setInternalValue(next);
    },
    [currentValue, isControlled, setInternalValue, onChangeRef]
  );

  return [currentValue, setValue];
}

function useUncontrolledState<T>({
  defaultValue,
  onChange,
}: UseUncontrolledStateOptions<T>): [
  value: T,
  setValue: SetState<T>,
  onChangeRef: React.RefObject<ChangeHandler<T>>,
] {
  const [value, setValue] = React.useState(defaultValue);

    const previousValueRef = React.useRef(value);

    const onChangeRef = React.useRef<ChangeHandler<T>>(onChange);

    useSafeInsertionEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

    React.useEffect(() => {
    if (Object.is(previousValueRef.current, value)) {
      return;
    }

    previousValueRef.current = value;
    onChangeRef.current(value);
  }, [value]);

  return [value, setValue, onChangeRef];
}