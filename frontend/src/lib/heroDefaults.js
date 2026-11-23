import { getAssetPath } from './pathUtils'

const CLOUD_STORAGE_BASE = 'https://gyrzipnfnxvccakeejky.supabase.co/storage/v1/object/public/members/avatars'

export const DEFAULT_HERO_MEMBERS = [
  {
    id: "iu",
    name: "IU",
    color: "bg-[#9D26FF]",
    photo: getAssetPath(`${CLOUD_STORAGE_BASE}/1795269664212_image_processing20260824_4000925_1cs3o3m_png.webp`),
    posX: 57,
    posY: 30,
    scale: 1,
    translateX: 0,
    translateY: 0,
    mobilePosX: 50,
    mobilePosY: 35,
    mobileScale: 1.3,
    mobileTranslateX: 0,
    mobileTranslateY: 0,
    flipX: false,
    mobileFlipX: false
  },
  {
    id: "chivy",
    name: "CHIVY",
    color: "bg-[#9D26FF]",
    photo: getAssetPath(`${CLOUD_STORAGE_BASE}/1795269698071_image_processing20260824_4011149_1iezoq8_png.webp`),
    posX: 50,
    posY: 30,
    scale: 1,
    translateX: 0,
    translateY: 0,
    mobilePosX: 50,
    mobilePosY: 31,
    mobileScale: 1.3,
    mobileTranslateX: 0,
    mobileTranslateY: 0,
    flipX: false,
    mobileFlipX: false
  },
  {
    id: "shin",
    name: "SHIN",
    color: "bg-[#9D26FF]",
    photo: getAssetPath(`${CLOUD_STORAGE_BASE}/1795269529780_image_processing20260824_4009109_122is0d_png.webp`),
    posX: 72,
    posY: 0,
    scale: 1,
    translateX: 0,
    translateY: 0,
    mobilePosX: 49,
    mobilePosY: 34,
    mobileScale: 1.3,
    mobileTranslateX: -30,
    mobileTranslateY: 0,
    flipX: false,
    mobileFlipX: false
  },
  {
    id: "yuna",
    name: "YUNA",
    color: "bg-[#9D26FF]",
    photo: getAssetPath(`${CLOUD_STORAGE_BASE}/1795269425434_image_processing20260824_4008041_bjfgi1_png.webp`),
    posX: 78,
    posY: 50,
    scale: 1,
    translateX: 0,
    translateY: 0,
    mobilePosX: 50,
    mobilePosY: 31,
    mobileScale: 1.3,
    mobileTranslateX: -41,
    mobileTranslateY: 0,
    flipX: false,
    mobileFlipX: false
  }
]
