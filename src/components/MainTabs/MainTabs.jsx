import { useState, useContext, createContext } from 'react';
import { styled } from '@mui/system';
import Planning from './Planning';
import List from './List';
import './styles/MainTabs.css';

// 1. Create a context to share selected index and setter
const TabsContext = createContext({
  value: 0,
  onChange: () => {},
});

// 2. Tabs root (uncontrolled by default, but supports controlled via props)
export function Tabs({
  defaultValue = 0,
  value: controlledValue,
  onChange: controlledOnChange,
  children,
  className,
}) {
  const isControlled = controlledValue != null;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const value = isControlled ? controlledValue : uncontrolledValue;
  const onChange = newValue => {
    if (!isControlled) setUncontrolledValue(newValue);
    if (controlledOnChange) controlledOnChange(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// 3. Styled pieces
const blue = {
  50: '#F0F7FF',
  100: '#C2E0FF',
  200: '#80BFFF',
  300: '#66B2FF',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E5',
  700: '#0059B2',
  800: '#004C99',
  900: '#003A75',
};

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

export const TabsList = styled('div')(
  ({ theme }) => `
    min-width: 300px;
    background-color: ${blue[500]};
    border-radius: 12px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 30px ${
      theme.palette.mode === 'dark' ? grey[900] : grey[200]
    };
  `
);

export const TabButton = styled('button')`
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  background: transparent;
  width: 100%;
  margin: 6px;
  border: none;
  border-radius: 7px;
  display: flex;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background-color: ${blue[400]};
  }

  &:focus {
    outline: 3px solid ${blue[200]};
    color: #fff;
  }

  &[data-selected='true'] {
    background-color: #fff;
    color: ${blue[600]};
  }

  &[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const TabPanel = styled('div')`
  width: 100%;
  height: 100%;
`;

// 4. Consumer components
export function Tab({ value, children, disabled }) {
  const { value: selected, onChange } = useContext(TabsContext);
  const isSelected = selected === value;

  return (
    <TabButton
      role="tab"
      data-selected={isSelected}
      aria-selected={isSelected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
    >
      {children}
    </TabButton>
  );
}

export function TabContent({ value, children }) {
  const { value: selected } = useContext(TabsContext);
  if (selected !== value) return null;
  return (
    <TabPanel role="tabpanel">
      {children}
    </TabPanel>
  );
}

// 5. Your MainTabs wiring
export default function MainTabs({ selectedDate, setSelectedDate }) {
  return (
    <Tabs defaultValue={0} className="tabs-container">
      <TabsList>
        <Tab value={0}>Planning</Tab>
        <Tab value={1}>Liste</Tab>
      </TabsList>

      <TabContent value={0}>
        <Planning
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </TabContent>

      <TabContent value={1} className="list-tab">
        <List
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </TabContent>
    </Tabs>
  );
}
