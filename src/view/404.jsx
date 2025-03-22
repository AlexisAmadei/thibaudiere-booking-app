import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Link, useNavigate } from "react-router-dom";

export default function NotFound404() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate('/');
    }, 1000);
  }, []);

  return (
    <Container>
      <Box>
        <Typography variant='h1'>404</Typography>
        <Link to='/'>Retour à l'accueil</Link>
      </Box>
    </Container>
  )
}
