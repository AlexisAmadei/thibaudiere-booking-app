import { Box, Container, Typography } from "@mui/material";
import { use } from "react";
import { Link } from "react-router-dom";

export default function NotFound404() {
  return (
    <Container>
      <Box>
        <Typography variant='h1'>404</Typography>
        <Link to='/'>Retour à l'accueil</Link>
      </Box>
    </Container>

  )
}
