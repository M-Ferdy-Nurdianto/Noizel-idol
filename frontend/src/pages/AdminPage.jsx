import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { supabase } from '../lib/supabase'
import { showToast } from '../lib/toast'
import Swal from 'sweetalert2'

import OrdersTab from './admin/tabs/OrdersTab'
import RecapTab from './admin/tabs/RecapTab'
import EventsTab from './admin/tabs/EventsTab'
import MerchTab from './admin/tabs/MerchTab'
import SettingsTab from './admin/tabs/SettingsTab'
import MembersTab from './admin/tabs/MembersTab'
import HomeTab from './admin/tabs/HomeTab'
import MediaTab from './admin/tabs/MediaTab'
import AboutUsTab from './admin/tabs/AboutUsTab'
import GuideTab from './admin/tabs/GuideTab'

import OrderDetailModal from './admin/modals/OrderDetailModal'
import OTSOrderModal from './admin/modals/OTSOrderModal'
import BulkDeleteModal from './admin/modals/BulkDeleteModal'
import EventModal from './admin/modals/EventModal'
import MerchBatchModal from './admin/modals/MerchBatchModal'
import DuplicateMerchModal from './admin/modals/DuplicateMerchModal'

import { generateExcel, generateMerchExcel, generateMerchPDF, generatePDF } from '../lib/exportUtils'
import { getValidAdminToken, logoutAdminSession, touchAdminSession } from '../lib/authSession'
import { updateCachedSocialLinks } from '../hooks/useSocialLinks'

import {
  FaSignOutAlt,
  FaShoppingCart,
  FaCalendar,
  FaChartBar,
  FaBox,
  FaEdit,
  FaUsers,
  FaEllipsisH,
  FaTimes,
  FaEye,
  FaHome,
  FaShieldAlt,
  FaSync,
  FaMusic,
  FaInfoCircle,
  FaBookOpen
} from 'react-icons/fa'

const AdminPage = () => {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('admin_active_tab')
    return saved === 'hero' ? 'home' : (saved || 'orders')
  })
  const [showMoreDrawer, setShowMoreDrawer] = useState(false)
  const [orderSubTab, setOrderSubTab] = useState(() => localStorage.getItem('admin_order_subtab') || 'all')
  const [orders, setOrders] = useState([])
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('admin_status_filter') || 'all')
  const [otsFilter, setOtsFilter] = useState(() => localStorage.getItem('admin_ots_filter') || 'all')
  const [eventFilter, setEventFilter] = useState(() => localStorage.getItem('admin_event_filter') || 'all')
  const [recapEventFilter, setRecapEventFilter] = useState(() => localStorage.getItem('admin_recap_event_filter') || 'all')
  const [dateFilter, setDateFilter] = useState(() => localStorage.getItem('admin_date_filter') || 'all')
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('admin_search_query') || '')
  const [dateFrom, setDateFrom] = useState(() => localStorage.getItem('admin_date_from') || '')
  const [dateTo, setDateTo] = useState(() => localStorage.getItem('admin_date_to') || '')

  const [showOTSModal, setShowOTSModal] = useState(false)
  const [otsSpecialOnly, setOtsSpecialOnly] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isOtsCartActive, setIsOtsCartActive] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)

  const [hargaPerMember, setHargaPerMember] = useState('25000')
  const [hargaGrup, setHargaGrup] = useState('30000')
  const [hargaOtsPerMember, setHargaOtsPerMember] = useState('25000')
  const [hargaOtsGrup, setHargaOtsGrup] = useState('30000')
  const [paymentBank, setPaymentBank] = useState('BCA')
  const [paymentRekening, setPaymentRekening] = useState('0902683273')
  const [paymentAtasNama, setPaymentAtasNama] = useState('Natasya Angelina Putri')
  const [paymentMethod, setPaymentMethod] = useState('Manual TF')
  const [paymentMerchBank, setPaymentMerchBank] = useState('BCA')
  const [paymentMerchRekening, setPaymentMerchRekening] = useState('0902683273')
  const [paymentMerchAtasNama, setPaymentMerchAtasNama] = useState('Natasya Angelina Putri')
  const [paymentMerchMethod, setPaymentMerchMethod] = useState('Manual TF')
  const [paymentChekiTransferActive, setPaymentChekiTransferActive] = useState(true)
  const [paymentChekiQrisActive, setPaymentChekiQrisActive] = useState(false)
  const [paymentChekiQrisImage, setPaymentChekiQrisImage] = useState('')
  const [paymentMerchTransferActive, setPaymentMerchTransferActive] = useState(true)
  const [paymentMerchQrisActive, setPaymentMerchQrisActive] = useState(false)
  const [paymentMerchQrisImage, setPaymentMerchQrisImage] = useState('')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [maintenanceEstimatedEnd, setMaintenanceEstimatedEnd] = useState('')
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    tiktok: '',
    youtube: '',
    twitter: '',
    discord: '',
    whatsapp_channel: ''
  })
  const [officialEmail, setOfficialEmail] = useState('contact@noize.official')
  const [configLoading, setConfigLoading] = useState(false)

  const [merch, setMerch] = useState([])
  const [merchOrders, setMerchOrders] = useState([])
  const [showMerchForm, setShowMerchForm] = useState(false)
  const [editingMerch, setEditingMerch] = useState(null)
  const [merchForm, setMerchForm] = useState({ 
    nama: '', 
    deskripsi: '', 
    harga: '', 
    stok: '', 
    available: true, 
    category: 'apparel',
    sizes: [], 
    size_chart_urls: [],
    jumbo_start_size: 'none',
    jumbo_increment_price: 5000
  })
  const [merchImageFile, setMerchImageFile] = useState(null)
  const [merchImagePreview, setMerchImagePreview] = useState('')
  const [merchExtraImageFiles, setMerchExtraImageFiles] = useState([])
  const [merchExtraImagePreviews, setMerchExtraImagePreviews] = useState([])
  const [merchSizeChartFiles, setMerchSizeChartFiles] = useState([null])
  const [merchSizeChartPreviews, setMerchSizeChartPreviews] = useState([''])
  const [availableSizes, setAvailableSizes] = useState('')
  const [merchHargaRaw, setMerchHargaRaw] = useState('')
  const [merchSaving, setMerchSaving] = useState(false)
  const merchFileInputRef = useRef(null)
  const extraImagesInputRef = useRef(null)
  const sizeChart1InputRef = useRef(null)

  const [merchOrderStatusFilter, setMerchOrderStatusFilter] = useState('all')
  const [merchOrderSearch, setMerchOrderSearch] = useState('')
  const [loadingMerchOrders, setLoadingMerchOrders] = useState(false)
  const [merchBatches, setMerchBatches] = useState([])
  const [activeMerchBatch, setActiveMerchBatch] = useState(null)
  const [merchBatchFilter, setMerchBatchFilter] = useState('all')
  const [selectedMerchBatchFilter, setSelectedMerchBatchFilter] = useState('all')
  const [showMerchBatchModal, setShowMerchBatchModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateTargetProduct, setDuplicateTargetProduct] = useState(null)

  useEffect(() => {
    checkAuth()
    fetchAll()

    document.documentElement.classList.add('dark')
    document.body.classList.add('dark-theme')

    let subscription = null
    if (supabase) {
      subscription = supabase
        .channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          fetchOrders(true)
          if (payload.eventType === 'INSERT' && payload.new.created_by === 'customer') {
            showToast.info(payload.new.nama_lengkap, 'Order Baru!')
          }
        })
        .subscribe()
    }

    return () => {
      if (supabase && subscription) {
        supabase.removeChannel(subscription)
      }
      const savedTheme = localStorage.getItem('noize-theme')
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
        document.body.classList.remove('dark-theme')
        document.body.classList.add('light-theme')
      }
    }
  }, [])

  const lastSearchRef = useRef(searchQuery)

  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab)
    const onlySearchChanged = lastSearchRef.current !== searchQuery
    lastSearchRef.current = searchQuery
    if (activeTab === 'orders') {
      fetchOrders(onlySearchChanged && orders.length > 0)
    }
  }, [statusFilter, otsFilter, eventFilter, dateFilter, dateFrom, dateTo, searchQuery, activeTab, orderSubTab])

  useEffect(() => {
    localStorage.setItem('admin_order_subtab', orderSubTab)
    if (events.length > 0) {
      if (orderSubTab === 'special') {
        const isCurrentSpecial = events.some(e => String(e.id) === String(eventFilter) && (e.is_special || e.type === 'special'))
        if (!isCurrentSpecial) {
          const activeSpecial = events.find(e => (e.is_special || e.type === 'special') && !e.is_past) || events.find(e => e.is_special || e.type === 'special')
          if (activeSpecial) setEventFilter(String(activeSpecial.id))
          else setEventFilter('all')
        }
      } else if (orderSubTab === 'all' || orderSubTab === 'ots' || orderSubTab === 'po') {
        const isCurrentSpecial = events.some(e => String(e.id) === String(eventFilter) && (e.is_special || e.type === 'special'))
        if (isCurrentSpecial) {
          const activeRegular = events.find(e => !e.is_special && e.type !== 'special' && !e.is_past) || events.find(e => !e.is_special && e.type !== 'special')
          if (activeRegular) setEventFilter(String(activeRegular.id))
          else setEventFilter('all')
        }
      }
    }
  }, [orderSubTab, events])

  useEffect(() => {
    localStorage.setItem('admin_status_filter', statusFilter)
    localStorage.setItem('admin_ots_filter', otsFilter)
    localStorage.setItem('admin_event_filter', eventFilter)
    localStorage.setItem('admin_recap_event_filter', recapEventFilter)
    localStorage.setItem('admin_date_filter', dateFilter)
    localStorage.setItem('admin_search_query', searchQuery)
    if (dateFrom) localStorage.setItem('admin_date_from', dateFrom)
    else localStorage.removeItem('admin_date_from')
    if (dateTo) localStorage.setItem('admin_date_to', dateTo)
    else localStorage.removeItem('admin_date_to')
  }, [statusFilter, otsFilter, eventFilter, recapEventFilter, dateFilter, searchQuery, dateFrom, dateTo])

  const checkAuth = () => {
    if (!getValidAdminToken()) {
      navigate('/admin/login')
    }
  }

  const fetchAll = () => {
    fetchOrders()
    fetchMembers()
    fetchEvents()
    fetchConfig()
    fetchMerchBatches()
    fetchMerch()
  }

  const buildOrderParams = () => {
    const params = {}

    if (statusFilter !== 'all') params.status = statusFilter

    if (orderSubTab === 'ots') params.is_ots = 'true'
    else if (orderSubTab === 'po') params.is_ots = 'false'
    else if (otsFilter !== 'all') params.is_ots = otsFilter

    if (eventFilter !== 'all') params.event_id = eventFilter
    if (searchQuery) params.search = searchQuery

    if (dateFilter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      params.dateFrom = weekAgo.toISOString()
    } else if (dateFilter === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      params.dateFrom = monthAgo.toISOString()
    } else if (dateFilter === 'custom' && dateFrom) {
      params.dateFrom = new Date(dateFrom).toISOString()
      if (dateTo) params.dateTo = new Date(dateTo).toISOString()
    }

    return params
  }

  const fetchOrders = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true)
      }
      const params = buildOrderParams()
      const response = await api.get('/orders', { params })
      setOrders(response.data.data || [])
    } catch (error) {
      console.error(error)
      if (error.response?.status === 401) {
        navigate('/admin/login')
      }
    } finally {
      if (!isBackground) {
        setLoading(false)
      }
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members')
      setMembers(res.data.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events')
      const eventList = res.data.data || []
      setEvents(eventList)

      // Otomatis pilih event aktif (bukan 'all') jika belum ada event spesifik yang dipilih
      if (eventList.length > 0) {
        setEventFilter(prev => {
          if (!prev || prev === 'all') {
            const isSpecialTab = orderSubTab === 'special'
            const activeEvent = isSpecialTab
              ? (eventList.find(e => (e.is_special || e.type === 'special') && !e.is_past) || eventList.find(e => e.is_special || e.type === 'special'))
              : (eventList.find(e => !e.is_special && e.type !== 'special' && !e.is_past) || eventList[0])
            return activeEvent ? String(activeEvent.id) : prev
          }
          return prev
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchConfig = async () => {
    try {
      const res = await api.get('/config')
      const configData = res.data.data || {}
      if (configData.harga_cheki_per_member) setHargaPerMember(configData.harga_cheki_per_member)
      if (configData.harga_cheki_grup) setHargaGrup(configData.harga_cheki_grup)
      if (configData.harga_ots_per_member) setHargaOtsPerMember(configData.harga_ots_per_member)
      if (configData.harga_ots_grup) setHargaOtsGrup(configData.harga_ots_grup)
      const chekiBank = configData.payment_cheki_bank || configData.payment_bank
      const chekiRek = configData.payment_cheki_rekening || configData.payment_rekening
      const chekiAn = configData.payment_cheki_atas_nama || configData.payment_atas_nama
      const chekiMethod = configData.payment_cheki_method || configData.payment_method
      if (chekiBank) setPaymentBank(chekiBank)
      if (chekiRek) setPaymentRekening(chekiRek)
      if (chekiAn) setPaymentAtasNama(chekiAn)
      if (chekiMethod) setPaymentMethod(chekiMethod)

      const merchBank = configData.payment_merch_bank || chekiBank || 'BCA'
      const merchRek = configData.payment_merch_rekening || chekiRek || '0902683273'
      const merchAn = configData.payment_merch_atas_nama || chekiAn || 'Natasya Angelina Putri'
      const merchMethod = configData.payment_merch_method || chekiMethod || 'Manual TF'
      setPaymentMerchBank(merchBank)
      setPaymentMerchRekening(merchRek)
      setPaymentMerchAtasNama(merchAn)
      setPaymentMerchMethod(merchMethod)
      setPaymentChekiTransferActive(configData.payment_cheki_transfer_active !== 'false')
      setPaymentChekiQrisActive(configData.payment_cheki_qris_active === 'true')
      setPaymentChekiQrisImage(configData.payment_cheki_qris_image || '')
      setPaymentMerchTransferActive(configData.payment_merch_transfer_active !== 'false')
      setPaymentMerchQrisActive(configData.payment_merch_qris_active === 'true')
      setPaymentMerchQrisImage(configData.payment_merch_qris_image || '')
      setMaintenanceMode(configData.maintenance_mode === 'true' || configData.maintenance_mode === true)
      if (configData.maintenance_message !== undefined) setMaintenanceMessage(configData.maintenance_message || '')
      if (configData.maintenance_estimated_end !== undefined) setMaintenanceEstimatedEnd(configData.maintenance_estimated_end || '')
      if (configData.social_links || configData.whatsapp_channel) {
        try {
          let parsed = {}
          if (configData.social_links) {
            parsed = typeof configData.social_links === 'string'
              ? JSON.parse(configData.social_links)
              : configData.social_links
          }
          if (configData.whatsapp_channel && !parsed.whatsapp_channel) {
            parsed.whatsapp_channel = configData.whatsapp_channel
          }
          if (parsed && typeof parsed === 'object') {
            setSocialLinks(prev => ({ ...prev, ...parsed }))
            updateCachedSocialLinks(parsed)
          }
        } catch (_) {}
      }
      let currentEmail = configData.contact_email
      if (!currentEmail && configData.footer_settings) {
        try {
          const f = typeof configData.footer_settings === 'string' ? JSON.parse(configData.footer_settings) : configData.footer_settings
          currentEmail = f.email
        } catch (_) {}
      }
      if (!currentEmail && configData.about_story_text) {
        try {
          const a = typeof configData.about_story_text === 'string' ? JSON.parse(configData.about_story_text) : configData.about_story_text
          currentEmail = a.cp_email
        } catch (_) {}
      }
      if (currentEmail) setOfficialEmail(currentEmail)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMerchBatches = async () => {
    try {
      const res = await api.get('/merch-batches')
      const list = res.data.data || []
      setMerchBatches(list)
      const active = list.find(b => b.is_active) || null
      setActiveMerchBatch(active)
      if (active) {
        setMerchBatchFilter(active.id)
        setSelectedMerchBatchFilter(active.id)
        fetchMerchOrders(active.id)
      } else {
        setMerchBatchFilter('all')
        setSelectedMerchBatchFilter('all')
        fetchMerchOrders('all')
      }
    } catch (error) {
      console.error('Error fetching merch batches:', error)
      fetchMerchOrders('all')
    }
  }

  const handleBatchActivated = async (batch) => {
    setActiveMerchBatch(batch)
    if (batch) {
      setMerchBatchFilter(batch.id)
      setSelectedMerchBatchFilter(batch.id)
    }
    fetchMerchBatches()
    fetchMerchOrders(batch ? batch.id : merchBatchFilter)
    fetchMerch()
  }

  const fetchMerch = async () => {
    try {
      const res = await api.get('/merchandise?admin=true')
      setMerch(res.data.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMerchOrders = async (batchId, isBackground = false) => {
    try {
      if (!isBackground) {
        setLoadingMerchOrders(true)
      }
      const bId = batchId !== undefined ? batchId : merchBatchFilter
      const params = {}
      if (merchOrderStatusFilter !== 'all') params.status = merchOrderStatusFilter
      if (merchOrderSearch) params.search = merchOrderSearch
      if (bId && bId !== 'all') params.batch_id = bId
      const res = await api.get('/merch-orders', { params })
      setMerchOrders(res.data.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      if (!isBackground) {
        setLoadingMerchOrders(false)
      }
    }
  }

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#9D26FF',
      cancelButtonText: 'Batal'
    }).then(r => {
      if (r.isConfirmed) {
        logoutAdminSession()
        navigate('/admin/login')
      }
    })
  }

  const handleStatusChange = async (orderId, status) => {
    // Optimistic UI update: update state immediately so dropdown & badge change instantly
    const prevOrders = orders
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    try {
      await api.patch(`/orders/${orderId}/status`, { status })
      showToast.success('Status updated!')
      fetchOrders(true)
    } catch (error) {
      setOrders(prevOrders)
      Swal.fire({ icon: 'error', title: 'Gagal Update Status', text: error.response?.data?.error || error.message })
    }
  }

  const handleDeleteOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Hapus Order?',
      text: 'Data tidak bisa dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    // Optimistic UI update
    const prevOrders = orders
    setOrders(prev => prev.filter(o => o.id !== orderId))
    try {
      await api.delete(`/orders/${orderId}`)
      Swal.fire('Deleted!', 'Order telah dihapus.', 'success')
      fetchOrders(true)
    } catch (error) {
      setOrders(prevOrders)
      Swal.fire('Error!', error.message, 'error')
    }
  }

  const handleBulkDelete = async (deleteType, params = {}) => {
    try {
      const response = await api.post('/orders/bulk-delete', { deleteType, ...params })
      showToast.success(response.data.message)
      fetchOrders(true)
      setShowBulkDeleteModal(false)
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.error || error.message, 'error')
    }
  }

  const handlePurgeOldPayments = async () => {
    const result = await Swal.fire({
      title: 'Bersihkan Bukti Pembayaran Lama?',
      text: 'Semua foto bukti bayar dari order yang usianya sudah lebih dari 30 hari akan dihapus dari Supabase Storage untuk menghemat kuota. Riwayat pesanan tetap tersimpan di database.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Bersihkan Sekarang',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      const response = await api.post('/orders/purge-old-payments')
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: response.data.message,
        confirmButtonColor: '#9D26FF'
      })
      fetchOrders(true)
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.error || error.message, 'error')
    }
  }

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setShowEventModal(true)
  }

  const handleDeleteEvent = async (eventId, eventName) => {
    const result = await Swal.fire({
      title: 'Hapus Event?',
      text: `Apakah Anda yakin ingin menghapus event "${eventName}"? Semua order terkait akan kehilangan referensi event.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      await api.delete(`/events/${eventId}`)
      showToast.success('Event berhasil dihapus')
      fetchEvents()
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.error || error.message, 'error')
    }
  }

  const handleTogglePast = async (eventId, currentStatus) => {
    const isNowPast = !currentStatus;
    const result = await Swal.fire({
      title: isNowPast ? 'Selesaikan Event?' : 'Aktifkan Event?',
      text: isNowPast 
        ? 'Apakah Anda yakin event ini sudah selesai?' 
        : 'Apakah Anda yakin ingin mengaktifkan event ini kembali?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isNowPast ? '#9D26FF' : '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: isNowPast ? 'Ya, Selesaikan' : 'Ya, Aktifkan',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'rounded-lg',
        cancelButton: 'rounded-lg'
      }
    });

    if (!result.isConfirmed) return;

    try {
      await api.patch(`/events/${eventId}`, { is_past: isNowPast })
      fetchEvents()
      showToast.success(isNowPast ? 'Event ditandai selesai!' : 'Event diaktifkan kembali!')
    } catch (error) {
      if (error.response?.status === 404) {
        showToast.error('Event ini sudah tidak ditemukan di database.', 'Event Tidak Ditemukan')
        fetchEvents()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.error || error.message })
      }
    }
  }

  const updateConfig = async (updates, silent = false) => {
    try {
      setConfigLoading(true)
      await api.patch('/config', updates)
      if (!silent) {
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Konfigurasi berhasil diupdate', confirmButtonColor: '#9D26FF' })
      } else {
        showToast.success('Pengaturan diperbarui')
      }
      fetchConfig()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: error.response?.data?.error || 'Gagal update konfigurasi', confirmButtonColor: '#9D26FF' })
    } finally {
      setConfigLoading(false)
    }
  }

  const viewOrderDetail = (order) => {
    setSelectedOrder(order)
    setShowOrderDetailModal(true)
  }

  const handleExportExcel = async ({ scope, value, financialConfig }) => {
    const params = scope === 'current' ? buildOrderParams() : {}
    await generateExcel({ scope, value, params, events, api, financialConfig })
  }

  const handleExportPdf = async ({ scope, value, financialConfig }) => {
    const params = scope === 'current' ? buildOrderParams() : {}
    await generatePDF({ scope, value, params, events, members, api, financialConfig })
  }

  const handleExportMerchExcel = async (exportOpts) => {
    let scope = 'all'
    let value = null
    let batchName = ''
    let bId = undefined

    if (typeof exportOpts === 'object' && exportOpts !== null) {
      scope = exportOpts.scope || 'all'
      value = exportOpts.value
      batchName = exportOpts.batchName
      if (scope === 'batch') bId = value
      else if (scope === 'current' && merchBatchFilter !== 'all') bId = merchBatchFilter
    } else if (exportOpts !== undefined) {
      bId = exportOpts !== 'all' ? exportOpts : undefined
      const batchObj = merchBatches.find(b => String(b.id) === String(exportOpts))
      batchName = batchObj ? batchObj.nama : ''
      scope = bId ? 'batch' : 'all'
    }

    await generateMerchExcel({
      scope,
      value,
      statusFilter: scope === 'current' ? merchOrderStatusFilter : undefined,
      searchQuery: scope === 'current' ? merchOrderSearch : undefined,
      batchId: bId,
      batchName
    })
  }

  const handleExportMerchPdf = async (exportOpts) => {
    let scope = 'all'
    let value = null
    let batchName = ''
    let bId = undefined

    if (typeof exportOpts === 'object' && exportOpts !== null) {
      scope = exportOpts.scope || 'all'
      value = exportOpts.value
      batchName = exportOpts.batchName
      if (scope === 'batch') bId = value
      else if (scope === 'current' && merchBatchFilter !== 'all') bId = merchBatchFilter
    } else if (exportOpts !== undefined) {
      bId = exportOpts !== 'all' ? exportOpts : undefined
      const batchObj = merchBatches.find(b => String(b.id) === String(exportOpts))
      batchName = batchObj ? batchObj.nama : ''
      scope = bId ? 'batch' : 'all'
    }

    await generateMerchPDF({
      api,
      scope,
      value,
      statusFilter: scope === 'current' ? merchOrderStatusFilter : undefined,
      searchQuery: scope === 'current' ? merchOrderSearch : undefined,
      batchId: bId,
      batchName
    })
  }

  const parseHarga = (input) => {
    if (!input) return ''
    let str = String(input).trim().toLowerCase()
    str = str.replace(/^(rp\.?\s*|idr\.?\s*)/i, '')
    if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
      str = str.replace(/\./g, '')
    }
    str = str.replace(',', '.')
    let multiplier = 1
    if (/k$/i.test(str)) { multiplier = 1000; str = str.replace(/k$/i, '') }
    else if (/rb$/i.test(str)) { multiplier = 1000; str = str.replace(/rb$/i, '') }
    else if (/ribu$/i.test(str)) { multiplier = 1000; str = str.replace(/ribu$/i, '') }
    else if (/jt$/i.test(str)) { multiplier = 1000000; str = str.replace(/jt$/i, '') }
    else if (/juta$/i.test(str)) { multiplier = 1000000; str = str.replace(/juta$/i, '') }
    const num = parseFloat(str)
    if (Number.isNaN(num)) return ''
    return Math.round(num * multiplier)
  }

  const handleHargaChange = (val) => {
    setMerchHargaRaw(val)
    const parsed = parseHarga(val)
    if (parsed !== '') {
      setMerchForm(f => ({ ...f, harga: parsed }))
    } else if (val === '') {
      setMerchForm(f => ({ ...f, harga: '' }))
    }
  }

  const openMerchForm = (item = null) => {
    if (item) {
      setEditingMerch(item)
      setMerchForm({
        nama: item.nama,
        deskripsi: item.deskripsi || '',
        harga: item.harga,
        stok: item.stok ?? '',
        available: item.available,
        category: item.category || (item.sizes && item.sizes.length > 0 ? 'apparel' : 'other'),
        sizes: item.sizes || [],
        size_chart_urls: item.size_chart_urls || [],
        batch_id: item.batch_id || '',
        jumbo_start_size: item.jumbo_start_size || 'none',
        jumbo_increment_price: item.jumbo_increment_price ?? 5000
      })
      const allProductImgs = Array.isArray(item.images) && item.images.length > 0 
        ? item.images 
        : (item.gambar_url ? [item.gambar_url] : [])
      const mainImg = item.gambar_url || allProductImgs[0] || ''
      const extraImgs = allProductImgs.length > 1 ? allProductImgs.slice(1) : []
      setMerchImagePreview(mainImg)
      setMerchExtraImagePreviews(extraImgs)
      setMerchExtraImageFiles(extraImgs.map(() => null))
      setAvailableSizes(Array.isArray(item.sizes) ? item.sizes.join(', ') : '')
      setMerchSizeChartPreviews([
        item.size_chart_urls?.[0] || ''
      ])
    } else {
      setEditingMerch(null)
      setMerchForm({
        nama: '',
        deskripsi: '',
        harga: '',
        stok: '',
        available: true,
        category: 'apparel',
        sizes: [],
        size_chart_urls: [],
        batch_id: activeMerchBatch?.id || (merchBatches[0]?.id || ''),
        jumbo_start_size: 'none',
        jumbo_increment_price: 5000
      })
      setMerchHargaRaw('')
      setMerchImagePreview('')
      setMerchExtraImagePreviews([])
      setMerchExtraImageFiles([])
      setAvailableSizes('')
      setMerchSizeChartPreviews([''])
    }
    setMerchImageFile(null)
    setMerchSizeChartFiles([null])
    setShowMerchForm(true)
  }

  const closeMerchForm = () => {
    setShowMerchForm(false)
    setEditingMerch(null)
    setMerchImageFile(null)
    setMerchImagePreview('')
    setMerchExtraImageFiles([])
    setMerchExtraImagePreviews([])
    if (extraImagesInputRef.current) extraImagesInputRef.current.value = ''
    setMerchSizeChartFiles([null])
    setMerchSizeChartPreviews([''])
    setAvailableSizes('')
  }

  const handleMerchImageChange = (e) => {
    const file = e?.target?.files?.[0] || (e instanceof File || e instanceof Blob ? e : null)
    if (!file) return
    setMerchImageFile(file)
    setMerchImagePreview(URL.createObjectURL(file))
  }

  const handleExtraImagesChange = (e) => {
    const files = e?.target?.files 
      ? Array.from(e.target.files) 
      : (Array.isArray(e) ? e : (e instanceof File ? [e] : []))
    if (files.length === 0) return
    const newPreviews = files.map(f => URL.createObjectURL(f))
    setMerchExtraImagePreviews(prev => [...prev, ...newPreviews])
    setMerchExtraImageFiles(prev => [...prev, ...files])
    if (extraImagesInputRef.current) extraImagesInputRef.current.value = ''
  }

  const handleRemoveExtraImage = (index) => {
    setMerchExtraImagePreviews(prev => prev.filter((_, i) => i !== index))
    setMerchExtraImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleToggleSize = (size) => {
    const currentSizes = availableSizes.split(',').map(s => s.trim()).filter(s => s !== '')
    if (currentSizes.includes(size)) {
      setAvailableSizes(currentSizes.filter(s => s !== size).join(', '))
    } else {
      setAvailableSizes([...currentSizes, size].join(', '))
    }
  }

  const handleSizeChartChange = (e, index) => {
    const file = e?.target?.files?.[0] || (e instanceof File || e instanceof Blob ? e : null)
    if (!file) return
    const newFiles = [...merchSizeChartFiles]
    newFiles[index] = file
    setMerchSizeChartFiles(newFiles)

    const newPreviews = [...merchSizeChartPreviews]
    newPreviews[index] = URL.createObjectURL(file)
    setMerchSizeChartPreviews(newPreviews)
  }

  const compressMerchImage = (file) => new Promise((resolve) => {
    const MAX_PX = 800
    const QUALITY = 0.82
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX }
        else { width = Math.round(width * MAX_PX / height); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', QUALITY)
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })

  const handleMerchSubmit = async (e) => {
    e.preventDefault()
    if (!merchForm.nama || !merchForm.harga) return showToast.warning('Nama dan harga merchandise wajib diisi')
    setMerchSaving(true)
    try {
      let gambar_url = editingMerch?.gambar_url || ''
      let size_chart_urls = [...(editingMerch?.size_chart_urls || [null])]
      if (size_chart_urls.length < 1) size_chart_urls = [size_chart_urls[0] || null]

      if (merchImageFile) {
        const compressed = await compressMerchImage(merchImageFile)
        const formData = new FormData()
        formData.append('file', compressed, 'merch.jpg')
        const uploadRes = await api.post('/upload/merch-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        gambar_url = uploadRes.data.data.url
      }

      if (merchSizeChartFiles[0]) {
        const compressed = await compressMerchImage(merchSizeChartFiles[0])
        const formData = new FormData()
        formData.append('file', compressed, 'size_chart.jpg')
        const uploadRes = await api.post('/upload/merch-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        size_chart_urls[0] = uploadRes.data.data.url
      }

      if (merchSizeChartPreviews[0] === '' && !merchSizeChartFiles[0]) {
        size_chart_urls[0] = null
      }

      // Upload extra product images if any
      const finalExtraUrls = []
      for (let i = 0; i < merchExtraImagePreviews.length; i++) {
        const file = merchExtraImageFiles[i]
        const preview = merchExtraImagePreviews[i]
        if (file) {
          const compressed = await compressMerchImage(file)
          const formData = new FormData()
          formData.append('file', compressed, `merch_extra_${Date.now()}_${i}.jpg`)
          const uploadRes = await api.post('/upload/merch-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          if (uploadRes.data?.data?.url) finalExtraUrls.push(uploadRes.data.data.url)
        } else if (preview && preview.startsWith('http')) {
          finalExtraUrls.push(preview)
        }
      }

      const allProductImages = [gambar_url, ...finalExtraUrls].filter(Boolean)
      const isApparel = merchForm.category !== 'other'

      const payload = {
        nama: merchForm.nama,
        deskripsi: merchForm.deskripsi || null,
        harga: parseInt(merchForm.harga, 10),
        stok: merchForm.stok !== '' ? parseInt(merchForm.stok, 10) : 0,
        gambar_url: gambar_url || (allProductImages[0] || null),
        images: allProductImages,
        available: merchForm.available,
        category: isApparel ? 'apparel' : 'other',
        sizes: isApparel ? availableSizes.split(',').map(s => s.trim()).filter(s => s !== '') : [],
        size_chart_urls: isApparel ? size_chart_urls.filter(url => url !== null) : [],
        batch_id: merchForm.batch_id || activeMerchBatch?.id || null,
        jumbo_start_size: isApparel && merchForm.jumbo_start_size !== 'none' ? merchForm.jumbo_start_size : null,
        jumbo_increment_price: isApparel ? (parseInt(merchForm.jumbo_increment_price, 10) || 0) : 0
      }

      if (editingMerch) {
        await api.put(`/merchandise/${editingMerch.id}`, payload)
        showToast.success('Merchandise berhasil diperbarui!')
      } else {
        await api.post('/merchandise', payload)
        showToast.success('Merchandise berhasil ditambahkan!')
      }

      closeMerchForm()
      fetchMerch()
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Gagal menyimpan merchandise')
    } finally {
      setMerchSaving(false)
    }
  }

  const handleDeleteMerch = async (id, nama) => {
    const result = await Swal.fire({
      title: `Hapus "${nama}"?`,
      text: 'Data merchandise ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return
    try {
      await api.delete(`/merchandise/${id}`)
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Merchandise berhasil dihapus', timer: 1500, showConfirmButton: false })
      fetchMerch()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: error.response?.data?.error || 'Gagal menghapus' })
    }
  }

  const handleToggleMerchAvailability = async (item, newValue = null) => {
    const isAvailable = newValue !== null ? (newValue === 'aktif') : !item.available
    const previousValue = item.available
    setMerch(prev => prev.map(m => (m.id === item.id ? { ...m, available: isAvailable } : m)))
    try {
      await api.put(`/merchandise/${item.id}`, { available: isAvailable })
      fetchMerch()
    } catch (error) {
      setMerch(prev => prev.map(m => (m.id === item.id ? { ...m, available: previousValue } : m)))
      Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Gagal update ketersediaan' })
    }
  }

  const handleMerchOrderStatusChange = async (orderId, newStatus) => {
    // Optimistic UI update
    const prevMerchOrders = merchOrders
    setMerchOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    try {
      await api.patch(`/merch-orders/${orderId}/status`, { status: newStatus })
      showToast.success('Status merch updated!')
      fetchMerchOrders(undefined, true)
    } catch (error) {
      setMerchOrders(prevMerchOrders)
      Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Gagal update status' })
    }
  }

  const handleDeleteMerchOrder = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Order Merch?',
      text: 'Order ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return

    // Optimistic UI update
    const prevMerchOrders = merchOrders
    setMerchOrders(prev => prev.filter(o => o.id !== id))
    try {
      await api.delete(`/merch-orders/${id}`)
      Swal.fire({ icon: 'success', title: 'Berhasil!', timer: 1500, showConfirmButton: false })
      fetchMerchOrders(undefined, true)
    } catch (error) {
      setMerchOrders(prevMerchOrders)
      Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Gagal menghapus' })
    }
  }

  // Bottom nav items (4 primary + More)
  const bottomNavItems = [
    { id: 'orders', label: 'Orders', icon: FaShoppingCart },
    { id: 'events', label: 'Events', icon: FaCalendar },
    { id: 'merch', label: 'Merch', icon: FaBox },
    { id: 'recap', label: 'Recap', icon: FaChartBar },
  ]

  const moreItems = [
    { id: 'members', label: 'Members', icon: FaUsers },
    { id: 'home', label: 'Home', icon: FaHome },
    { id: 'about', label: 'About Us', icon: FaInfoCircle },
    { id: 'settings', label: 'Settings', icon: FaEdit },
    { id: 'guide', label: 'Panduan', icon: FaBookOpen },
  ]

  return (
    <div className="admin-layout min-h-screen md:h-screen md:overflow-hidden bg-transparent text-white flex flex-col md:flex-row selection:bg-[#9D26FF] selection:text-white">
      {/* SIDEBAR — desktop only */}
      <aside className="hidden md:flex w-64 md:sticky md:top-0 md:h-screen md:overflow-hidden bg-[#09090B]/90 backdrop-blur-xl border-r border-white/10 p-6 flex-col justify-between shadow-2xl z-20">
        <div>
          <div className="mb-10 px-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/noize-logo.png" alt="Noize Logo" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-xl font-black text-white tracking-tight uppercase">NOI<span className="text-[#9D26FF]">ZE</span></h1>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Admin Dashboard</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'orders', label: 'Orders', icon: FaShoppingCart },
              { id: 'events', label: 'Events', icon: FaCalendar },
              { id: 'members', label: 'Members', icon: FaUsers },
              { id: 'merch', label: 'Merchandise', icon: FaBox },
              { id: 'home', label: 'Home', icon: FaHome },
              { id: 'about', label: 'About Us', icon: FaInfoCircle },
              { id: 'recap', label: 'Recap', icon: FaChartBar },
              { id: 'settings', label: 'Settings', icon: FaEdit },
              { id: 'guide', label: 'Panduan', icon: FaBookOpen },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-[#9D26FF] text-white shadow-[0_0_20px_rgba(7,145,8,0.4)] translate-x-1' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`text-lg ${activeTab === item.id ? 'text-white' : 'text-zinc-500'}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <button 
          onClick={handleLogout} 
          className="mt-8 w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
        >
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 md:h-screen md:overflow-y-auto pb-24 md:pb-10 space-y-6">
        {activeTab === 'orders' && (
          <OrdersTab
            orders={orders}
            events={events}
            loading={loading}
            orderSubTab={orderSubTab}
            setOrderSubTab={setOrderSubTab}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            eventFilter={eventFilter}
            setEventFilter={setEventFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onViewOrder={viewOrderDetail}
            onDeleteOrder={handleDeleteOrder}
            onStatusChange={handleStatusChange}
            onShowOTSModal={() => { setOtsSpecialOnly(false); setShowOTSModal(true) }}
            onShowOTSSpecialModal={() => { setOtsSpecialOnly(true); setShowOTSModal(true) }}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            merchOrders={merchOrders}
            loadingMerchOrders={loadingMerchOrders}
            merchOrderSearch={merchOrderSearch}
            setMerchOrderSearch={setMerchOrderSearch}
            merchOrderStatusFilter={merchOrderStatusFilter}
            setMerchOrderStatusFilter={setMerchOrderStatusFilter}
            merchBatches={merchBatches}
            merchBatchFilter={merchBatchFilter}
            setMerchBatchFilter={setMerchBatchFilter}
            onMerchOrderStatusChange={handleMerchOrderStatusChange}
            onDeleteMerchOrder={handleDeleteMerchOrder}
            onFetchMerchOrders={fetchMerchOrders}
            onExportMerchExcel={handleExportMerchExcel}
            onExportMerchPdf={handleExportMerchPdf}
            members={members}
            hargaOtsPerMember={hargaOtsPerMember}
            hargaOtsGrup={hargaOtsGrup}
            onRefreshOrders={fetchOrders}
            onOtsCartActiveChange={setIsOtsCartActive}
          />
        )}

        {activeTab === 'events' && (
          <EventsTab
            events={events}
            members={members}
            onDeleteEvent={handleDeleteEvent}
            onTogglePast={handleTogglePast}
            onRefresh={fetchEvents}
          />
        )}

        {activeTab === 'merch' && (
          <MerchTab
            merch={merch}
            merchBatches={merchBatches}
            selectedMerchBatchFilter={selectedMerchBatchFilter}
            setSelectedMerchBatchFilter={setSelectedMerchBatchFilter}
            onOpenBatchModal={() => setShowMerchBatchModal(true)}
            onOpenDuplicateModal={(item) => {
              setDuplicateTargetProduct(item)
              setShowDuplicateModal(true)
            }}
            showMerchForm={showMerchForm}
            editingMerch={editingMerch}
            merchForm={merchForm}
            setMerchForm={setMerchForm}
            merchHargaRaw={merchHargaRaw}
            handleHargaChange={handleHargaChange}
            availableSizes={availableSizes}
            setAvailableSizes={setAvailableSizes}
            merchImagePreview={merchImagePreview}
            merchFileInputRef={merchFileInputRef}
            handleMerchImageChange={handleMerchImageChange}
            setMerchImageFile={setMerchImageFile}
            setMerchImagePreview={setMerchImagePreview}
            merchExtraImagePreviews={merchExtraImagePreviews}
            extraImagesInputRef={extraImagesInputRef}
            handleExtraImagesChange={handleExtraImagesChange}
            handleRemoveExtraImage={handleRemoveExtraImage}
            merchSizeChartPreviews={merchSizeChartPreviews}
            setMerchSizeChartPreviews={setMerchSizeChartPreviews}
            setMerchSizeChartFiles={setMerchSizeChartFiles}
            sizeChart1InputRef={sizeChart1InputRef}
            merchSaving={merchSaving}
            openMerchForm={openMerchForm}
            closeMerchForm={closeMerchForm}
            handleMerchSubmit={handleMerchSubmit}
            handleSizeChartChange={handleSizeChartChange}
            handleToggleSize={handleToggleSize}
            onToggleMerchAvailability={handleToggleMerchAvailability}
            handleDeleteMerch={handleDeleteMerch}
          />
        )}

        {activeTab === 'recap' && (
          <RecapTab
            orders={orders}
            events={events}
            recapEventFilter={recapEventFilter}
            setRecapEventFilter={setRecapEventFilter}
            merchOrders={merchOrders}
            merchBatches={merchBatches}
          />
        )}

        {activeTab === 'members' && (
          <MembersTab
            members={members}
            onRefresh={fetchMembers}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            hargaPerMember={hargaPerMember}
            setHargaPerMember={setHargaPerMember}
            hargaGrup={hargaGrup}
            setHargaGrup={setHargaGrup}
            hargaOtsPerMember={hargaOtsPerMember}
            setHargaOtsPerMember={setHargaOtsPerMember}
            hargaOtsGrup={hargaOtsGrup}
            setHargaOtsGrup={setHargaOtsGrup}
            paymentBank={paymentBank}
            setPaymentBank={setPaymentBank}
            paymentRekening={paymentRekening}
            setPaymentRekening={setPaymentRekening}
            paymentAtasNama={paymentAtasNama}
            setPaymentAtasNama={setPaymentAtasNama}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentMerchBank={paymentMerchBank}
            setPaymentMerchBank={setPaymentMerchBank}
            paymentMerchRekening={paymentMerchRekening}
            setPaymentMerchRekening={setPaymentMerchRekening}
            paymentMerchAtasNama={paymentMerchAtasNama}
            setPaymentMerchAtasNama={setPaymentMerchAtasNama}
            paymentMerchMethod={paymentMerchMethod}
            setPaymentMerchMethod={setPaymentMerchMethod}
            paymentChekiTransferActive={paymentChekiTransferActive}
            setPaymentChekiTransferActive={setPaymentChekiTransferActive}
            paymentChekiQrisActive={paymentChekiQrisActive}
            setPaymentChekiQrisActive={setPaymentChekiQrisActive}
            paymentChekiQrisImage={paymentChekiQrisImage}
            setPaymentChekiQrisImage={setPaymentChekiQrisImage}
            paymentMerchTransferActive={paymentMerchTransferActive}
            setPaymentMerchTransferActive={setPaymentMerchTransferActive}
            paymentMerchQrisActive={paymentMerchQrisActive}
            setPaymentMerchQrisActive={setPaymentMerchQrisActive}
            paymentMerchQrisImage={paymentMerchQrisImage}
            setPaymentMerchQrisImage={setPaymentMerchQrisImage}
            maintenanceMode={maintenanceMode}
            setMaintenanceMode={setMaintenanceMode}
            maintenanceMessage={maintenanceMessage}
            setMaintenanceMessage={setMaintenanceMessage}
            maintenanceEstimatedEnd={maintenanceEstimatedEnd}
            setMaintenanceEstimatedEnd={setMaintenanceEstimatedEnd}
            socialLinks={socialLinks}
            setSocialLinks={setSocialLinks}
            officialEmail={officialEmail}
            setOfficialEmail={setOfficialEmail}
            configLoading={configLoading}
            updateConfig={updateConfig}
            onShowBulkDeleteModal={() => setShowBulkDeleteModal(true)}
            onPurgeOldPayments={handlePurgeOldPayments}
          />
        )}

        {(activeTab === 'home' || activeTab === 'hero') && (
          <HomeTab setActiveTab={setActiveTab} />
        )}

        {(activeTab === 'about' || activeTab === 'media') && (
          <AboutUsTab />
        )}

        {activeTab === 'guide' && (
          <GuideTab setActiveTab={setActiveTab} />
        )}
      </main>

      {showOrderDetailModal && selectedOrder && (
        <OrderDetailModal
          isOpen={showOrderDetailModal}
          onClose={() => setShowOrderDetailModal(false)}
          order={selectedOrder}
          events={events}
        />
      )}

      {showOTSModal && (
        <OTSOrderModal
          members={members}
          events={events}
          onClose={() => { setShowOTSModal(false); setOtsSpecialOnly(false) }}
          onSuccess={() => {
            setShowOTSModal(false)
            setOtsSpecialOnly(false)
            fetchOrders(true)
          }}
          hargaOtsPerMember={hargaOtsPerMember}
          hargaOtsGrup={hargaOtsGrup}
          specialOnly={otsSpecialOnly}
        />
      )}

      {showBulkDeleteModal && (
        <BulkDeleteModal
          events={events}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      {showEventModal && (
        <EventModal
          members={members}
          editingEvent={editingEvent}
          onClose={() => {
            setShowEventModal(false)
            setEditingEvent(null)
          }}
          onSuccess={() => {
            setShowEventModal(false)
            setEditingEvent(null)
            fetchEvents()
          }}
        />
      )}

      {showMerchBatchModal && (
        <MerchBatchModal
          isOpen={showMerchBatchModal}
          onClose={() => setShowMerchBatchModal(false)}
          batches={merchBatches}
          onRefreshBatches={fetchMerchBatches}
          onBatchActivated={handleBatchActivated}
        />
      )}

      {showDuplicateModal && duplicateTargetProduct && (
        <DuplicateMerchModal
          isOpen={showDuplicateModal}
          onClose={() => {
            setShowDuplicateModal(false)
            setDuplicateTargetProduct(null)
          }}
          product={duplicateTargetProduct}
          batches={merchBatches}
          onSuccess={() => {
            fetchMerch()
          }}
        />
      )}

      {/* ── BOTTOM NAVBAR (mobile only) ── */}
      {!isOtsCartActive && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090B]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
          <div className="flex items-stretch">
            {bottomNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setShowMoreDrawer(false) }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold transition-all ${
                  activeTab === item.id
                    ? 'text-[#9D26FF]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <item.icon className={`text-lg transition-all ${activeTab === item.id ? 'text-[#9D26FF] drop-shadow-[0_0_6px_#9D26FF]' : ''}`} />
                {item.label}
                {activeTab === item.id && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#9D26FF] rounded-full" />
                )}
              </button>
            ))}
            {/* More button */}
            <button
              onClick={() => setShowMoreDrawer(prev => !prev)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold transition-all ${
                showMoreDrawer || ['members','home','about','settings','guide'].includes(activeTab)
                  ? 'text-[#9D26FF]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FaEllipsisH className={`text-lg ${showMoreDrawer || ['members','home','about','settings','guide'].includes(activeTab) ? 'text-[#9D26FF]' : ''}`} />
              More
            </button>
          </div>
        </nav>
      )}

      {/* ── MORE DRAWER (mobile) ── */}
      {!isOtsCartActive && showMoreDrawer && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMoreDrawer(false)}
          />
          {/* Drawer */}
          <div className="md:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-[#09090B]/98 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.7)] rounded-t-2xl px-4 py-4 animate-fade-in">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="space-y-2">
              {moreItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowMoreDrawer(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === item.id
                      ? 'bg-[#9D26FF]/20 text-[#9D26FF] border border-[#9D26FF]/40'
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <item.icon className="text-base" />
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { setShowMoreDrawer(false); handleLogout() }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminPage
