import * as React from 'react';
import { styled } from '@mui/system';
import { Tabs } from '@mui/base/Tabs';
import { TabsList as BaseTabsList } from '@mui/base/TabsList';
import { TabPanel as BaseTabPanel } from '@mui/base/TabPanel';
import { buttonClasses } from '@mui/base/Button';
import { Tab as BaseTab, tabClasses } from '@mui/base/Tab';
import Planning from './Planning';
import List from './List';
import './styles/MainTabs.css';

export default function MainTabs({ selectedDate, setSelectedDate }) {
    return (
        <Tabs defaultValue={0} className='tabs-container'>
            <TabsList>
                <Tab value={0}>Planning</Tab>
                <Tab value={1}>Liste</Tab>
            </TabsList>
            <TabPanel value={0}>
                <Planning selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            </TabPanel>
            <TabPanel value={1} className='list-tab'>
                <List selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            </TabPanel>
        </Tabs>
    );
}

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

const Tab = styled(BaseTab)`
    color: #fff;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    background-color: transparent;
    width: 100%;
    margin: 6px;
    border: none;
    border-radius: 7px;
    display: flex;
    justify-content: center;

    &:hover {
      background-color: ${blue[400]};
    }

    &:focus {
      color: #fff;
      outline: 3px solid ${blue[200]};
    }

    &.${tabClasses.selected} {
      background-color: #fff;
      color: ${blue[600]};
    }

    &.${buttonClasses.disabled} {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

const TabPanel = styled(BaseTabPanel)(
    ({ theme }) => `
    max-width: 100%;
    height: 100%;
    `,
);

const TabsList = styled(BaseTabsList)(
    ({ theme }) => `
    min-width: 300px;
    background-color: ${blue[500]};
    border-radius: 12px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    place-content: space-between center;
    box-shadow: 0 4px 30px ${theme.palette.mode === 'dark' ? grey[900] : grey[200]};
    `,
);