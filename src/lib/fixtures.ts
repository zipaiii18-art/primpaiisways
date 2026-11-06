/** Static UI defaults only. No customer, order, warranty, or playlist demo records. */
import type { AppearanceSettings, OptionCategory } from './types'

export const DEFAULT_OPTIONS: Record<OptionCategory, string[]> = {
  application: [
    'Netflix', 'Disney+', 'Viu', 'YouTube', 'Prime Video', 'Vidio', 'Canva',
    'ChatGPT', 'WeTV', 'iQIYI', 'Loklok', 'HBO', 'BS Station', 'GagaOla',
    'CapCut', 'Youku', 'Claude AI',
  ],
  plan: [
    'Sharing', 'Private', 'Go sharing', 'Go private', 'Plus sharing',
    'Plus private', 'Pro', 'Education', 'STD', 'Basic', 'Premium', 'Famplan',
    'Indplan', 'Mix Plan', 'Semi private', 'Sharing basic', 'Sharing standart',
    'Private basic', 'Private standart', 'Mobile only sharing',
    'Mobile only private', 'Tv only sharing', 'Tv only private',
    'All device sharing', 'All device private',
  ],
  user: ['1p1u', '1p2u', '2u', '3u', '4u', '5u', '6u', '7u', '8u'],
}

export const FONT_OPTIONS = ['Nunito', 'Quicksand', 'Poppins', 'DM Sans', 'Lora']
export const TITLE_FONT_OPTIONS = [
  'Dancing Script',
  'Cormorant Garamond',
  'Playfair Display',
  'Lora',
  'Quicksand',
]

export const SYMBOL_CHOICES = ['♡', '✧', '𝜗𝜚', '𓆩♡𓆪', 'ꕤ', '☁️', '𑄝੭', '⭑', '✿', '❀', '☾', '♫']

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  dark: false,
  bodyFont: 'Nunito',
  titleFont: 'Dancing Script',
  titleSize: 'md',
  symbols: {
    dashboard: '♡',
    rekapan: '✧',
    reminder: '𝜗𝜚',
    garansi: '𓆩♡𓆪',
    setting: 'ꕤ',
  },
}

export const SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1F95-UMgaSWF8zIapli2j40NehaGPvCszQvnxsuxSmcM/edit?usp=sharing'
export const SPREADSHEET_PREVIEW_URL =
  'https://docs.google.com/spreadsheets/d/1F95-UMgaSWF8zIapli2j40NehaGPvCszQvnxsuxSmcM/preview'

