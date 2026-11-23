import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import api from '../lib/api'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { getAssetPath } from '../lib/pathUtils'
import { DEFAULT_HERO_MEMBERS } from '../lib/heroDefaults'

// Refactored Components
import HeroSection from '../components/home/HeroSection'
import AboutSection from '../components/home/AboutSection'
import ScheduleSection from '../components/home/ScheduleSection'
import ShopPreviewSection from '../components/home/ShopPreviewSection'
import FAQSection from '../components/home/FAQSection'

// In-memory cache for instant navigation without re-loading screen
let cachedHomeData = {
  events: null,
  faqs: null,
  members: null,
  heroSettings: null,
  cachedMembersList: null,
}

const HomePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!cachedHomeData.events)
  const [faqs, setFaqs] = useState(cachedHomeData.faqs || [])
  const [openFaq, setOpenFaq] = useState(null)
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [events, setEvents] = useState(cachedHomeData.events || [])
  const [merchPreview, setMerchPreview] = useState(cachedHomeData.merchPreview || [])
  const [shopMembers, setShopMembers] = useState(cachedHomeData.cachedMembersList || [])
  const [groupMember, setGroupMember] = useState(cachedHomeData.groupMember || null)
  const [siteConfig, setSiteConfig] = useState(cachedHomeData.siteConfig || null)

  const getInitialMembers = () => {
    if (cachedHomeData.members && cachedHomeData.members.length > 0) return cachedHomeData.members
    try {
      const stored = localStorage.getItem('noize_hero_members')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (_) {}
    return DEFAULT_HERO_MEMBERS
  }

  const [members, setMembers] = useState(getInitialMembers)
  const [heroTitle, setHeroTitle] = useState(cachedHomeData.heroSettings?.title || 'NOIZE')
  const [heroSubtitle, setHeroSubtitle] = useState(cachedHomeData.heroSettings?.subtitle || 'PRODUCTION')
  const [heroTagline, setHeroTagline] = useState(cachedHomeData.heroSettings?.tagline || '')
  const [heroTitleColor, setHeroTitleColor] = useState(cachedHomeData.heroSettings?.titleColor || '#FFFFFF')
  const [heroSubtitleColor, setHeroSubtitleColor] = useState(cachedHomeData.heroSettings?.subtitleColor || '#24C6F5')
  const [heroTaglineColor, setHeroTaglineColor] = useState(cachedHomeData.heroSettings?.taglineColor || '#FFFFFF')

  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
    const fetchData = async () => {
        try {
            const [eventsRes, faqsRes, configRes, membersRes] = await Promise.allSettled([ 
              api.get('/events'), 
              api.get('/faqs'),
              api.get('/config'),
              api.get('/members')
            ])

            if (eventsRes.status === 'fulfilled' && eventsRes.value.data.success) {
                const monthMap = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 };
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const upcoming = eventsRes.value.data.data
                    .filter(e => {
                        if (e.is_past) return false;
                        const eventDate = new Date(e.tahun, monthMap[e.bulan] || 0, e.tanggal);
                        return eventDate >= now;
                    })
                    .sort((a, b) => {
                        const dateA = new Date(a.tahun, monthMap[a.bulan] || 0, a.tanggal);
                        const dateB = new Date(b.tahun, monthMap[b.bulan] || 0, b.tanggal);
                        return dateA - dateB;
                    })
                    .slice(0, 3)
                setEvents(upcoming)
                cachedHomeData.events = upcoming
            }
            if (faqsRes.status === 'fulfilled' && faqsRes.value.data.success) {
              setFaqs(faqsRes.value.data.data)
              cachedHomeData.faqs = faqsRes.value.data.data
            }

            // Dapatkan daftar member aktif dari database (bukan group dan hadir !== false)
            let activeMemberSlugs = null
            if (membersRes.status === 'fulfilled' && membersRes.value.data.success) {
              const dbMembers = membersRes.value.data.data || []
              const grp = dbMembers.find(m => m.member_id === 'group')
              if (grp) {
                setGroupMember(grp)
                cachedHomeData.groupMember = grp
              }
              const activeDbMembers = dbMembers
                .filter(m => m.hadir !== false && m.member_id !== 'group')
                .sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99))
              setShopMembers(activeDbMembers)
              cachedHomeData.cachedMembersList = activeDbMembers

              activeMemberSlugs = new Set()
              dbMembers.forEach(m => {
                if (m.hadir !== false && m.member_id !== 'group') {
                  if (m.member_id) activeMemberSlugs.add(String(m.member_id).toLowerCase().trim())
                  if (m.id) activeMemberSlugs.add(String(m.id).toLowerCase().trim())
                  if (m.nama_panggung) activeMemberSlugs.add(String(m.nama_panggung).toLowerCase().trim())
                }
              })
            }

            if (configRes.status === 'fulfilled' && configRes.value.data.success) {
              const configData = configRes.value.data.data || {}
              setSiteConfig(configData)
              cachedHomeData.siteConfig = configData
              if (configData.hero_settings) {
                let settings = configData.hero_settings
                if (typeof settings === 'string') {
                  try { settings = JSON.parse(settings) } catch (_) {}
                }
                if (settings.title) setHeroTitle(settings.title)
                if (settings.subtitle) setHeroSubtitle(settings.subtitle)
                if (settings.tagline) setHeroTagline(settings.tagline)
                if (settings.titleColor) setHeroTitleColor(settings.titleColor)
                if (settings.subtitleColor) setHeroSubtitleColor(settings.subtitleColor)
                if (settings.taglineColor) setHeroTaglineColor(settings.taglineColor)
                cachedHomeData.heroSettings = settings

                if (Array.isArray(settings.members) && settings.members.length > 0) {
                  const filteredMembers = activeMemberSlugs
                    ? settings.members.filter(m => {
                        const mId = String(m.id || '').toLowerCase().trim()
                        const mName = String(m.name || '').toLowerCase().trim()
                        return activeMemberSlugs.has(mId) || activeMemberSlugs.has(mName)
                      })
                    : settings.members
                  setMembers(filteredMembers)
                  cachedHomeData.members = filteredMembers
                  try {
                    localStorage.setItem('noize_hero_members', JSON.stringify(filteredMembers))
                  } catch (_) {}
                }
              }
            }

            try {
                const merchRes = await api.get('/merchandise?available=true')
                if (merchRes.data.success) {
                  const merchData = merchRes.data.data.slice(0, 4)
                  setMerchPreview(merchData)
                  cachedHomeData.merchPreview = merchData
                }
            } catch (_) {}
        } catch (error) {
            console.error('Failed to fetch home data:', error)
        } finally {
            setLoading(false)
        }
    }
    fetchData()
  }, [])
  
  // Render immediately using default/cached states to avoid blank screen transition

  let aboutSettings = null
  if (siteConfig?.home_who_is_noize) {
    try {
      aboutSettings = typeof siteConfig.home_who_is_noize === 'string'
        ? JSON.parse(siteConfig.home_who_is_noize)
        : siteConfig.home_who_is_noize
    } catch (_) {}
  }

  let faqSettings = null
  if (siteConfig?.faq_section_settings) {
    try {
      faqSettings = typeof siteConfig.faq_section_settings === 'string'
        ? JSON.parse(siteConfig.faq_section_settings)
        : siteConfig.faq_section_settings
    } catch (_) {}
  }

  return (
    <div className="min-h-screen bg-transparent text-white overflow-x-hidden relative">
      <Header />
      
      <HeroSection 
        members={members} 
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        heroTagline={heroTagline}
        heroTitleColor={heroTitleColor}
        heroSubtitleColor={heroSubtitleColor}
        heroTaglineColor={heroTaglineColor}
        activeMemberId={activeMemberId} 
        setActiveMemberId={setActiveMemberId} 
        navigate={navigate} 
      />
      
      <AboutSection aboutSettings={aboutSettings} navigate={navigate} getAssetPath={getAssetPath} />
      
      <ScheduleSection loading={loading} events={events} navigate={navigate} />
      
      <ShopPreviewSection 
        merchPreview={merchPreview} 
        shopMembers={shopMembers} 
        groupMember={groupMember}
        siteConfig={siteConfig}
        navigate={navigate} 
        getAssetPath={getAssetPath} 
      />
      
      <FAQSection faqSettings={faqSettings} faqs={faqs} openFaq={openFaq} setOpenFaq={setOpenFaq} />

      <Footer />
    </div>
  )
}

export default HomePage
