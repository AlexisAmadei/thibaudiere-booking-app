import { Box, Dialog, Typography } from '@mui/material'
import Button from '../Button/Button'
import { deleteBooking } from '../../Utils/booking';

export default function DialogConfirmDelete({ confirmDelete, setConfirmDelete, fetchBookings, idToDelete }) {

    async function proceedDeletion() {
        try {
            await deleteBooking(idToDelete);
        } catch {
            alert('Erreur lors de la suppression de la réservation.');
        } finally {
            fetchBookings();
            setConfirmDelete(false);
        }
    }

    return (
        <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} fullWidth>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, padding: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Êtes-vous sûr de vouloir supprimer cette réservation ?
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                    <Button onClick={() => setConfirmDelete(false)} variant="outlined">
                        Annuler
                    </Button>
                    <Button onClick={proceedDeletion} variant="contained">
                        Confirmer
                    </Button>
                </Box>
            </Box>
        </Dialog>
    )
}
