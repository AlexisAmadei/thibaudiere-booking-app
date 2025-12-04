import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#e6f7f7' },
          100: { value: '#b3e6e6' },
          200: { value: '#80d4d4' },
          300: { value: '#4dc2c2' },
          400: { value: '#26b3b3' },
          500: { value: '#00a3a3' },
          600: { value: '#009494' },
          700: { value: '#008080' },
          800: { value: '#006b6b' },
          900: { value: '#004d4d' },
          950: { value: '#003333' },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: '{colors.brand.500}' },
          contrast: { value: 'white' },
          fg: {
            value: {
              _light: '{colors.brand.700}',
              _dark: '{colors.brand.300}'
            }
          },
          muted: {
            value: {
              _light: '{colors.brand.100}',
              _dark: '{colors.brand.900}'
            }
          },
          subtle: {
            value: {
              _light: '{colors.brand.50}',
              _dark: '{colors.brand.950}'
            }
          },
          emphasized: {
            value: {
              _light: '{colors.brand.600}',
              _dark: '{colors.brand.400}'
            }
          },
          focusRing: { value: '{colors.brand.500}' },
          border: {
            value: {
              _light: '{colors.brand.200}',
              _dark: '{colors.brand.800}'
            }
          },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, customConfig)
