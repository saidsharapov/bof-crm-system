/**
 * orderStore — thin wrapper kept for backwards compatibility.
 * All data now comes from the real API via ordersApi.
 */
import { create } from 'zustand'
import { ordersApi, type Order as ApiOrder, type OrderStatus } from '../api/orders'

export type { OrderStatus } from '../api/orders'

export interface OrderItem {
  productId: string
  qty: number
  price?: number
}

export interface Order {
  id: string
  num: string
  clientName: string
  phone: string
  address: string
  comment: string
  source?: string      // sourceId
  deadline?: string
  items: OrderItem[]
  totalAmount?: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export function calcTotal(items: OrderItem[]): number {
  return items.reduce((s, it) => s + it.qty * (it.price ?? 0), 0)
}

function mapOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    num: o.num,
    clientName: o.clientName,
    phone: o.phone,
    address: o.address ?? '',
    comment: o.comment ?? '',
    source: o.sourceId ?? o.source?.id,
    deadline: o.deadline,
    items: o.items,
    totalAmount: o.totalAmount,
    status: o.status,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

interface OrderState {
  orders: Order[]
  loading: boolean
  fetch: () => Promise<void>
  createOrder: (o: Omit<Order, 'id' | 'num' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Order>
  updateOrder: (id: string, patch: Partial<Omit<Order, 'id' | 'num' | 'createdAt'>>) => Promise<void>
  setStatus: (id: string, status: OrderStatus) => Promise<void>
  removeOrder: (id: string) => Promise<void>
}

export const useOrderStore = create<OrderState>()((set) => ({
  orders: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const res = await ordersApi.list({ limit: 500 })
      set({ orders: res.items.map(mapOrder) })
    } finally {
      set({ loading: false })
    }
  },

  createOrder: async (o) => {
    const created = await ordersApi.create({
      clientName: o.clientName,
      phone: o.phone,
      address: o.address,
      comment: o.comment,
      sourceId: o.source,
      deadline: o.deadline,
      items: o.items,
    })
    const order = mapOrder(created)
    set((s) => ({ orders: [order, ...s.orders] }))
    return order
  },

  updateOrder: async (id, patch) => {
    const updated = await ordersApi.update(id, {
      clientName: patch.clientName,
      phone: patch.phone,
      address: patch.address,
      comment: patch.comment,
      sourceId: patch.source,
      deadline: patch.deadline,
      items: patch.items,
      status: patch.status,
    })
    const order = mapOrder(updated)
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? order : o)) }))
  },

  setStatus: async (id, status) => {
    const updated = await ordersApi.setStatus(id, status)
    const order = mapOrder(updated)
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? order : o)) }))
  },

  removeOrder: async (id) => {
    await ordersApi.delete(id)
    set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }))
  },
}))
