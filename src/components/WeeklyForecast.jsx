import { Box, Flex, Text } from "@chakra-ui/react";
import { Cloud, CloudLightning, CloudRain, CloudRainWind, CloudSnow, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const GRADIENT_DAY = 'linear-gradient(180deg,rgba(52, 109, 186, 1) 0%, rgba(86, 141, 186, 1) 100%)';

function weatherIcon(code) {
  if (code === 0 || code === 1) return <Sun size={16} />;
  if (code <= 3 || code <= 48) return <Cloud size={16} />;
  if (code <= 67) return <CloudRain size={16} />;
  if (code <= 77) return <CloudSnow size={16} />;
  if (code <= 82) return <CloudRainWind size={16} />;
  if (code <= 86) return <CloudSnow size={16} />;
  return <CloudLightning size={16} />;
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function WeeklyForecast() {
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        const resp = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=47.4035&longitude=0.5969&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=Europe%2FParis&forecast_days=7'
        );
        const data = await resp.json();
        setForecast(data.daily);
      } catch (error) {
        console.error('Error fetching weekly forecast:', error);
      }
    }
    fetchForecast();
  }, []);

  if (!forecast) return null;

  return (
    <Flex
      gap={1}
      overflowX="auto"
      css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
      backgroundImage={GRADIENT_DAY}
      borderRadius="lg"
      px={2}
      py={2}
    >
      {forecast.time.map((date, i) => {
        const dayName = DAY_NAMES[new Date(date).getDay()];
        const isToday = i === 0;
        return (
          <Flex
            key={date}
            direction="column"
            alignItems="center"
            gap={1}
            flex="1"
            minW="40px"
            color="white"
            px={1}
            py={1}
            borderRadius="md"
            bg={isToday ? 'whiteAlpha.300' : 'transparent'}
          >
            <Text fontSize="xs" fontWeight={isToday ? 'bold' : 'normal'}>
              {isToday ? 'Auj.' : dayName}
            </Text>
            <Box>{weatherIcon(forecast.weather_code[i])}</Box>
            <Text fontSize="xs" fontWeight="bold">{Math.round(forecast.temperature_2m_max[i])}°</Text>
            <Text fontSize="xs" opacity={0.75}>{Math.round(forecast.temperature_2m_min[i])}°</Text>
          </Flex>
        );
      })}
    </Flex>
  );
}
