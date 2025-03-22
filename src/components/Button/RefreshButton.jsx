import React from 'react'
import Button from './Button'
import { RefreshRounded } from '@mui/icons-material'

export default function RefreshButton({ handleRefreshList }) {
    return (
        <Button onClick={handleRefreshList} variant="contained">
            <RefreshRounded />
            Rafraîchir la liste
        </Button>
    )
}
