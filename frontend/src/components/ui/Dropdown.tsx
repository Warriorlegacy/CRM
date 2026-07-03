'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue>({
  open: false,
  setOpen: () => {},
});

interface DropdownProps {
  children: ReactNode;
}

export default function Dropdown({ children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function Trigger({ children, asChild = false }: { children: ReactNode; asChild?: boolean }) {
  const { open, setOpen } = useContext(DropdownContext);

  if (asChild) {
    return (
      <div onClick={() => setOpen(!open)} className="inline-block">
        {children}
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(!open)}
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  );
}

interface MenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

function MenuItem({ children, onClick, icon, disabled = false, danger = false }: MenuItemProps) {
  const { setOpen } = useContext(DropdownContext);
  const itemRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (!disabled) {
      onClick?.();
      setOpen(false);
    }
  };

  return (
    <button
      ref={itemRef}
      onClick={handleClick}
      disabled={disabled}
      className={[
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md transition-colors',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : danger
            ? 'text-red-400 hover:bg-red-500/10'
            : 'text-zinc-200 hover:bg-zinc-800',
      ].join(' ')}
    >
      {icon && <span className="shrink-0 text-zinc-500">{icon}</span>}
      {children}
    </button>
  );
}

function Divider() {
  return <div className="my-1.5 border-t border-zinc-800" />;
}

function Menu({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { open } = useContext(DropdownContext);

  if (!open) return null;

  return (
    <div
      className={[
        'absolute right-0 mt-2 z-50 min-w-[12rem] p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40',
        'animate-in zoom-in-95 fade-in duration-150',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

Dropdown.Trigger = Trigger;
Dropdown.Menu = Menu;
Dropdown.MenuItem = MenuItem;
Dropdown.Divider = Divider;
