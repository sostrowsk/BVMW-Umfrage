import React, { useState, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import ReactDOM from "react-dom";
export interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
}
export const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }[type];
  const icon = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }[type];
  return typeof window !== "undefined" ? ReactDOM.createPortal(
    <div
      className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } z-50`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{message}</span>
    </div>,
    document.body
  ) : null;
};
interface ToastState {
  toasts: Array<ToastProps & { id: string }>;
}
class ToastManager {
  private state: ToastState = { toasts: [] };
  private listeners: Array<(state: ToastState) => void> = [];
  private container: HTMLDivElement | null = null;
  private root: Root | null = null;
  constructor() {
    if (typeof window !== "undefined") {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      document.body.appendChild(this.container);
      this.root = createRoot(this.container);
    }
  }
  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
    this.render();
  }
  private render() {
    if (!this.root) return;
    this.root.render(
      <div className="fixed bottom-0 right-0 p-6 space-y-3 z-50">
        {this.state.toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => this.remove(toast.id)}
          />
        ))}
      </div>
    );
  }
  show(props: ToastProps) {
    const id = Math.random().toString(36).substr(2, 9);
    this.state.toasts.push({ ...props, id });
    this.notify();
  }
  remove(id: string) {
    this.state.toasts = this.state.toasts.filter((t) => t.id !== id);
    this.notify();
  }
  success(message: string, duration?: number) {
    this.show({ message, type: "success", duration });
  }
  error(message: string, duration?: number) {
    this.show({ message, type: "error", duration });
  }
  warning(message: string, duration?: number) {
    this.show({ message, type: "warning", duration });
  }
  info(message: string, duration?: number) {
    this.show({ message, type: "info", duration });
  }
}
export const toast = new ToastManager();