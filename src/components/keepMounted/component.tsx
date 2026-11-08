import { ReactNode, useEffect, useState } from "react";

interface KeepMountedProps {
  open: boolean;
  children: ReactNode;
}

const KeepMounted = ({ open, children }: KeepMountedProps) => {
  const [hasOpened, setHasOpened] = useState(open);

  useEffect(() => {
    if (open && !hasOpened) {
      setHasOpened(true);
    }
  }, [open, hasOpened]);

  if (!open && !hasOpened) {
    return null;
  }

  return <div style={{ display: open ? "block" : "none" }}>{children}</div>;
};

export default KeepMounted;
