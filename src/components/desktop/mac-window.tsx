"use client";

import type { CSSProperties, ReactNode } from "react";
import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";
import type { Messages } from "@/lib/i18n";

export type MacWindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const trafficLight = "size-3.5 rounded-full ring-1 ring-black/15 transition hover:brightness-90";

export function MacWindow({
  title,
  icon,
  bounds,
  zIndex,
  active,
  minimized,
  maximized,
  labels,
  onFocus,
  onBoundsChange,
  onMinimize,
  onToggleMaximize,
  onClose,
  children,
}: {
  title: string;
  icon: ReactNode;
  bounds: MacWindowBounds;
  zIndex: number;
  active: boolean;
  minimized: boolean;
  maximized: boolean;
  labels: Messages["desktop"];
  onFocus: () => void;
  onBoundsChange: (next: Partial<MacWindowBounds>) => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const style: CSSProperties = {
    display: minimized ? "none" : "flex",
    flexDirection: "column",
    pointerEvents: "auto",
    zIndex,
  };

  return (
    <Rnd
      size={maximized ? { width: "100%", height: "100%" } : { width: bounds.width, height: bounds.height }}
      position={maximized ? { x: 0, y: 0 } : { x: bounds.x, y: bounds.y }}
      minWidth={320}
      minHeight={240}
      bounds="parent"
      dragHandleClassName="window-drag-handle"
      cancel=".window-control"
      disableDragging={maximized}
      enableResizing={!maximized}
      onDragStart={onFocus}
      onDragStop={(_event, data) => onBoundsChange({ x: data.x, y: data.y })}
      onResizeStart={onFocus}
      onResizeStop={(_event, _direction, element, _delta, position) =>
        onBoundsChange({
          width: element.offsetWidth,
          height: element.offsetHeight,
          x: position.x,
          y: position.y,
        })
      }
      style={style}
      className={cn(
        "overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl",
        active ? "border-border/80 ring-1 ring-foreground/10" : "border-border/40"
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col" onMouseDownCapture={onFocus}>
        <header
          onDoubleClick={onToggleMaximize}
          className="window-drag-handle flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-muted/50 px-3 select-none"
        >
          <div className="window-control flex items-center gap-2" onDoubleClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={onClose} aria-label={labels.close} className={cn(trafficLight, "bg-[#ff5f57]")} />
            <button
              type="button"
              onClick={onMinimize}
              aria-label={labels.minimize}
              className={cn(trafficLight, "bg-[#febc2e]")}
            />
            <button
              type="button"
              onClick={onToggleMaximize}
              aria-label={maximized ? labels.restore : labels.maximize}
              className={cn(trafficLight, "bg-[#28c840]")}
            />
          </div>

          <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
            <span aria-hidden className="shrink-0 [&_svg]:size-3.5">
              {icon}
            </span>
            <span className="truncate">{title}</span>
          </div>

          <div aria-hidden className="w-14 shrink-0" />
        </header>

        {/* The body is its own query container: tool layouts must respond to the window's width,
            not the viewport's, otherwise a narrow window falls back to a stacked layout and
            overflows into a scrollbar. The title bar sits outside this scrollport, so sticky
            tool previews only need a small inset. */}
        <div className="window-scroll @container min-h-0 flex-1 overflow-auto bg-background p-3 sm:p-4 [--tool-sticky-top:0.75rem]">
          {children}
        </div>
      </div>
    </Rnd>
  );
}
