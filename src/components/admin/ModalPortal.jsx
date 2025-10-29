// ===============================
// ModalPortal.jsx — Root-level modal wrapper
// ===============================
import { createPortal } from "react-dom";
import React from "react";

/**
 * Renders children directly under document.body
 * so it's never trapped inside overflowing containers.
 */
export default function ModalPortal({ children }) {
  const el = React.useRef(document.createElement("div"));

  React.useEffect(() => {
    const current = el.current;
    document.body.appendChild(current);
    return () => {
      document.body.removeChild(current);
    };
  }, []);

  return createPortal(children, el.current);
}
