import { Box } from '@mui/material'
import React from 'react'
import Select from 'react-select'
import { monthFilterOptions } from '../../Utils/monthFilterOptions'

export default function FilterSelect({ handleFilterSelect, monthFilter }) {
    return (
        <Box className="filter-list">
            <Select
                onChange={handleFilterSelect}
                options={monthFilterOptions}
                defaultValue={[monthFilterOptions[0]]}
                name='monthFilter'
                className='month-filter'
                isMulti
                value={monthFilter}
            />
        </Box>
    );
}
