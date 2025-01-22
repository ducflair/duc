import "./ToolIcon.scss";

import React, { CSSProperties, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useExcalidrawContainer } from "./App";
import { AbortError } from "../errors";
import Spinner from "./Spinner";
import { PointerType } from "../element/types";
import { isPromiseLike } from "../utils";

export type ToolButtonSize = "small" | "medium";

type ToolButtonBaseProps = {
  icon?: React.ReactNode;
  "aria-label": string;
  "aria-keyshortcuts"?: string;
  "data-testid"?: string;
  label?: string;
  title?: string;
  name?: string;
  id?: string;
  size?: ToolButtonSize;
  keyBindingLabel?: string | null;
  showAriaLabel?: boolean;
  hidden?: boolean;
  visible?: boolean;
  selected?: boolean;
  className?: string;
  style?: CSSProperties;
  isLoading?: boolean;
};

type ToolButtonProps =
  | (ToolButtonBaseProps & {
      type: "button";
      children?: React.ReactNode;
      onClick?(event: React.MouseEvent): void;
    })
  | (ToolButtonBaseProps & {
      type: "submit";
      children?: React.ReactNode;
      onClick?(event: React.MouseEvent): void;
    })
  | (ToolButtonBaseProps & {
      type: "icon";
      children?: React.ReactNode;
      onClick?(): void;
    })
  | (ToolButtonBaseProps & {
      type: "radio";
      checked: boolean;
      onChange?(data: { pointerType: PointerType | null }): void;
      onPointerDown?(data: { pointerType: PointerType }): void;
    });

export const ToolButton: React.FC<ToolButtonProps> = React.forwardRef((props, ref) => {
  const {
    visible = true,
    className = "",
    size = "medium",
    ...rest
  } = props;

  const { id: excalId } = useExcalidrawContainer();
  const innerRef = React.useRef(null);
  React.useImperativeHandle(ref, () => innerRef.current);
  const sizeCn = `ToolIcon_size_${size}`;

  const [isLoading, setIsLoading] = useState(false);

  const isMountedRef = useRef(true);

  const onClick = async (event: React.MouseEvent) => {
    const ret = "onClick" in rest && rest.onClick?.(event);

    if (isPromiseLike(ret)) {
      try {
        setIsLoading(true);
        await ret;
      } catch (error: any) {
        if (!(error instanceof AbortError)) {
          throw error;
        } else {
          console.warn(error);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const lastPointerTypeRef = useRef<PointerType | null>(null);

  if (
    rest.type === "button" ||
    rest.type === "icon" ||
    rest.type === "submit"
  ) {
    const type = (rest.type === "icon" ? "button" : rest.type) as
      | "button"
      | "submit";
    return (
      <button
        className={clsx(
          "ToolIcon_type_button",
          sizeCn,
          className,
          visible && !rest.hidden
            ? "ToolIcon_type_button--show"
            : "ToolIcon_type_button--hide",
          {
            ToolIcon: !rest.hidden,
            "ToolIcon--selected": rest.selected,
            "ToolIcon--plain": rest.type === "icon",
          },
        )}
        style={rest.style}
        data-testid={rest["data-testid"]}
        hidden={rest.hidden}
        title={rest.title}
        aria-label={rest["aria-label"]}
        type={type}
        onClick={onClick}
        ref={innerRef}
        disabled={isLoading || rest.isLoading}
      >
        {(rest.icon || rest.label) && (
          <div className="ToolIcon__icon" aria-hidden="true">
            {rest.icon || rest.label}
            {rest.keyBindingLabel && (
              <span className="ToolIcon__keybinding">
                {rest.keyBindingLabel}
              </span>
            )}
            {rest.isLoading && <Spinner />}
          </div>
        )}
        {rest.showAriaLabel && (
          <div className="ToolIcon__label">
            {rest["aria-label"]} {isLoading && <Spinner />}
          </div>
        )}
        {rest.children}
      </button>
    );
  }

  return (
    <label
      className={clsx("ToolIcon", className)}
      title={rest.title}
      onPointerDown={(event) => {
        lastPointerTypeRef.current = event.pointerType || null;
        rest.onPointerDown?.({ pointerType: event.pointerType || null });
      }}
      onPointerUp={() => {
        requestAnimationFrame(() => {
          lastPointerTypeRef.current = null;
        });
      }}
    >
      <input
        className={`ToolIcon_type_radio ${sizeCn}`}
        type="radio"
        name={rest.name}
        aria-label={rest["aria-label"]}
        aria-keyshortcuts={rest["aria-keyshortcuts"]}
        data-testid={rest["data-testid"]}
        id={`${excalId}-${rest.id}`}
        onChange={() => {
          rest.onChange?.({ pointerType: lastPointerTypeRef.current });
        }}
        checked={rest.checked}
        ref={innerRef}
      />
      <div className="ToolIcon__icon">
        {rest.icon}
        {rest.keyBindingLabel && (
          <span className="ToolIcon__keybinding">{rest.keyBindingLabel}</span>
        )}
      </div>
    </label>
  );
});
    
