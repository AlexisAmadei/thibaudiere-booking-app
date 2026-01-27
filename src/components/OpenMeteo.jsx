import { Box, Flex } from "@chakra-ui/react";
import { Droplets } from "lucide-react";
import { CloudRain } from "lucide-react";
import { CloudRainWind } from "lucide-react";
import { DropletOff } from "lucide-react";
import { Sun } from "lucide-react";
import { Moon } from "lucide-react";
import { useState, useEffect } from "react";

const GRADIENT_NIGHT = 'linear-gradient(180deg,rgba(21, 39, 87, 1) 0%, rgba(34, 63, 103, 1) 100%)';
const GRADIENT_DAY = 'linear-gradient(180deg,rgba(52, 109, 186, 1) 0%, rgba(86, 141, 186, 1) 100%)';

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
          justifyContent={'space-between'}
          gap={4}
          px={4} py={2}
          boxShadow="md"
          borderRadius={'lg'}
          backgroundImage={meteoData.current.is_day ? GRADIENT_DAY : GRADIENT_NIGHT}
        >
          <Box>
            {meteoData.current.is_day ? <Sun /> : <Moon />}
          </Box>

          <Flex direction="row" alignItems="center" gap={2}>
            {meteoData.current.precipitation > 0 ? <CloudRainWind /> : null}
            <Box fontSize="lg" fontWeight="bold">
              {meteoData.current.temperature_2m}°C
            </Box>
          </Flex>
        </Flex>
      ) : (
        <Box mb={4} textAlign="center">
          Loading weather data...
        </Box>
      )}
    </Box>
  );
}