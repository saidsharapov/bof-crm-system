import { apiClient } from './client'

export interface DashboardKpi {
  ordersToday: number
  ordersWeek: number
  ordersActive: number
  revenueWeek: number
  lowStockCount: number
}

export interface DashboardChartPoint {
  day: string
  orders: number
  revenue: number
}

export interface DashboardRecentOrder {
  id: string
  num: string
  clientName: string
  status: string
  totalAmount?: number
  createdAt: string
  items?: { qty: number }[]
}

export interface DashboardRecentMovement {
  id: string
  type: 'IN' | 'OUT'
  qty: number
  comment?: string
  createdAt: string
  product?: { name: string }
  material?: { name: string; unit: string }
}

export interface DashboardData {
  kpi: DashboardKpi
  chart: DashboardChartPoint[]
  recentOrders: DashboardRecentOrder[]
  recentMovements: DashboardRecentMovement[]
}

export const dashboardApi = {
  getStats: () =>
    apiClient.get<DashboardData>('/dashboard').then(r => r.data),
}
