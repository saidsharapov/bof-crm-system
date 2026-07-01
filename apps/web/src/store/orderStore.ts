import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OrderStatus = 'NEW' | 'IN_WORK' | 'DELIVERING' | 'DELIVERED' | 'CANCELED'

export interface OrderItem {
  productId: string
  qty: number
  price?: number   // цена за единицу, UZS
}

export interface Order {
  id: string
  num: string
  clientName: string
  phone: string
  address: string
  comment: string
  source?: string       // id из OrderSource справочника
  deadline?: string     // ISO — срок исполнения
  items: OrderItem[]
  totalAmount?: number  // итого по заказу, UZS
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export function calcTotal(items: OrderItem[]): number {
  return items.reduce((s, it) => s + it.qty * (it.price ?? 0), 0)
}

interface OrderState {
  orders: Order[]
  nextNum: number
  createOrder: (o: Omit<Order, 'id' | 'num' | 'status' | 'createdAt' | 'updatedAt'>) => Order
  updateOrder: (id: string, patch: Partial<Omit<Order, 'id' | 'num' | 'createdAt'>>) => void
  setStatus: (id: string, status: OrderStatus) => void
  removeOrder: (id: string) => void
}

function uid() { return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
const now    = (d = 0) => new Date(Date.now() - d * 86400000).toISOString()
const future = (h = 0) => new Date(Date.now() + h * 3600000).toISOString()

const INIT_ORDERS: Order[] = [
  {
    id: 'ord_1', num: '#0001',
    clientName: 'ИП Иванова А.С.', phone: '+7 900 123-45-67',
    address:    'Москва, ул. Ленина, 12, оф. 3',
    comment:    'Нанесение логотипа на левой груди',
    deadline:   now(1),  // просрочен — вчера
    items:      [{ productId: 'p_init_1', qty: 30, price: 850 }, { productId: 'p_init_2', qty: 20, price: 920 }],
    totalAmount: 30 * 850 + 20 * 920,
    status:     'IN_WORK',
    createdAt: now(3), updatedAt: now(1),
  },
  {
    id: 'ord_2', num: '#0002',
    clientName: 'Школа №142', phone: '+7 495 876-54-32',
    address:    'Москва, пр. Мира, 88',
    comment:    'Срочно! Форма на выпускной',
    deadline:   future(6),  // срочно — через 6 часов
    items:      [{ productId: 'p_init_4', qty: 45, price: 750 }],
    totalAmount: 45 * 750,
    status:     'NEW',
    createdAt: now(1), updatedAt: now(1),
  },
  {
    id: 'ord_3', num: '#0003',
    clientName: 'ООО «Спорт-Юг»', phone: '+7 863 200-10-20',
    address:    'Ростов-на-Дону, ул. Садовая, 55',
    comment:    '',
    deadline:   future(72),  // через 3 дня
    items:      [{ productId: 'p_init_3', qty: 15, price: 1100 }, { productId: 'p_init_6', qty: 10, price: 980 }],
    totalAmount: 15 * 1100 + 10 * 980,
    status:     'DELIVERING',
    createdAt: now(5), updatedAt: now(1),
  },
  {
    id: 'ord_4', num: '#0004',
    clientName: 'Кирилл Петров', phone: '+7 912 333-22-11',
    address:    'Краснодар, ул. Красная, 1',
    comment:    'Размеры уточнить по телефону',
    deadline:   now(2),  // просрочен
    items:      [{ productId: 'p_init_5', qty: 5, price: 1350 }],
    totalAmount: 5 * 1350,
    status:     'DELIVERED',
    createdAt: now(7), updatedAt: now(2),
  },
  {
    id: 'ord_5', num: '#0005',
    clientName: 'Марина Козлова', phone: '+7 916 555-44-33',
    address:    'СПб, Невский пр., 100',
    comment:    'Отмена по просьбе клиента',
    items:      [{ productId: 'p_init_1', qty: 10, price: 850 }],
    totalAmount: 10 * 850,
    status:     'CANCELED',
    createdAt: now(8), updatedAt: now(6),
  },
]

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: INIT_ORDERS,
      nextNum: 6,

      createOrder: (o) => {
        let num = 6
        set((s) => { num = s.nextNum; return {} })
        const order: Order = {
          ...o,
          id: uid(),
          num: `#${String(num).padStart(4, '0')}`,
          totalAmount: calcTotal(o.items),
          status: 'NEW',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ orders: [order, ...s.orders], nextNum: s.nextNum + 1 }))
        return order
      },

      updateOrder: (id, patch) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o
            const updated = { ...o, ...patch, updatedAt: new Date().toISOString() }
            if (patch.items) updated.totalAmount = calcTotal(patch.items)
            return updated
          }),
        })),

      setStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
          ),
        })),

      removeOrder: (id) =>
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
    }),
    { name: 'bof-orders' },
  ),
)
