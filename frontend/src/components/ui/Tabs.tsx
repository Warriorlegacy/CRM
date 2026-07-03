'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
  activeTab: '',
  setActiveTab: () => {},
});

interface TabsProps {
  defaultTab?: string;
  value?: string;
  onChange?: (id: string) => void;
  children: ReactNode;
  className?: string;
}

export default function Tabs({
  defaultTab = '',
  value,
  onChange,
  children,
  className = '',
}: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab);
  const activeTab = value ?? internalTab;

  const setActiveTab = useCallback(
    (id: string) => {
      if (value === undefined) setInternalTab(id);
      onChange?.(id);
    },
    [value, onChange],
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: ReactNode;
  className?: string;
}

function TabList({ children, className = '' }: TabListProps) {
  return (
    <div
      role="tablist"
      className={`flex gap-1 border-b border-zinc-800 ${className}`}
    >
      {children}
    </div>
  );
}

interface TabProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

function Tab({ id, children, disabled = false, className = '' }: TabProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={isActive}
      aria-controls={`tabpanel-${id}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(id)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
        }
      }}
      className={[
        'relative px-4 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'text-emerald-400'
          : 'text-zinc-500 hover:text-zinc-300',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
      )}
    </button>
  );
}

interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

function TabPanel({ id, children, className = '' }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={`py-4 ${className}`}
    >
      {children}
    </div>
  );
}

Tabs.TabList = TabList;
Tabs.Tab = Tab;
Tabs.TabPanel = TabPanel;
