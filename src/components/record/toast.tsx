"use client";

// Lightweight page-wide toast, matching the prototype. Any client component can
// call showToast(); the Toast element in RecordShell listens.

import { useEffect, useRef, useState } from "react";

const EVENT = "pv-toast";

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export function Toast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), 3200);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return <div className={`toast${visible ? " show" : ""}`}>{message}</div>;
}
