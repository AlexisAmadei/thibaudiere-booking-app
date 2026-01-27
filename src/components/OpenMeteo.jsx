import { Box, Flex } from "@chakra-ui/react";
import { Droplets } from "lucide-react";
import { DropletOff } from "lucide-react";
import { Sun } from "lucide-react";
import { Moon } from "lucide-react";
import { useState, useEffect } from "react";

export default function OpenMeteo() {
  const [meteoData, setMeteoData] = useState(null);

  async function fetchOpenMeteo() {
    try {
      const resp = await fetch('https://api.open-meteo.com/v1/forecast?latitude=47.4035&longitude=0.5969&current=temperature_2m,precipitation,is_day');
      const data = await resp.json();
      setMeteoData(data);
    } catch (error) {
      console.error('Error fetching Open-Meteo data:', error);
    }
  }

  useEffect(() => {
    fetchOpenMeteo();
  }, []);

  return (
    <Box
      width={'100%'}
    >
      {meteoData ? (
        <Flex
          textAlign="center"
          color='white'
          direction="row"
          alignItems="center"
          justifyContent={'center'}
          gap={4}
          p={2}
          borderRadius={'md'}
          backgroundImage={meteoData.current.is_day ? 'linear-gradient(140deg, rgb(16, 16, 90) 0%, rgba(0, 212, 255, 1) 100%)' : 'linear-gradient(140deg,rgba(2, 0, 36, 1) 0%, rgb(16, 16, 90) 100%)'}
        >
          <Box>
            {meteoData.current.is_day ? <Sun /> : <Moon />}
          </Box>

          <Box fontSize="lg" fontWeight="bold">
            {meteoData.current.temperature_2m}°C
          </Box>
        </Flex>
      ) : (
        <Box mb={4} textAlign="center">
          Loading weather data...
        </Box>
      )}
    </Box>
  );
}