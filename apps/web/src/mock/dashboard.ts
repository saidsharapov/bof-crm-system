import type { UserRole } from '@/store/authStore'

// ── KPI metrics ──────────────────────────────────────────────────────────────
export interface KpiMetric {
  id: string
  label: string
  value: string
  subValue?: string
  trend: number[]          // last 7 data points for sparkline
  delta: number            // % change vs yesterday
  color: 'brand' | 'emerald' | 'amber' | 'rose'
  roles: UserRole[]
}

export const KPI_METRICS: KpiMetric[] = [
  {
    id: 'orders',
    label: 'Заказов сегодня',
    value: '12',
    subValue: 'из 47 за неделю',
    trend: [5, 8, 6, 11, 9, 14, 12],
    delta: +14,
    color: 'brand',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'revenue',
    label: 'Выручка сегодня',
    value: '84 500 UZS',
    subValue: '6 заказов оплачено',
    trend: [42000, 61000, 55000, 78000, 69000, 91000, 84500],
    delta: +8,
    color: 'emerald',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'stock',
    label: 'Остаток ткани',
    value: '1 240 кг',
    subValue: 'критично < 200 кг',
    trend: [1400, 1380, 1350, 1320, 1290, 1260, 1240],
    delta: -2,
    color: 'amber',
    roles: ['ADMIN', 'WAREHOUSE'],
  },
  {
    id: 'production',
    label: 'В пошиве',
    value: '3 партии',
    subValue: '~240 изделий',
    trend: [1, 2, 1, 3, 2, 4, 3],
    delta: +25,
    color: 'rose',
    roles: ['ADMIN', 'WAREHOUSE'],
  },
]

// ── Weekly chart data ─────────────────────────────────────────────────────────
export interface DayPoint {
  day: string
  orders: number
  revenue: number
}

export const WEEKLY_DATA: DayPoint[] = [
  { day: 'Пн', orders: 5,  revenue: 42000  },
  { day: 'Вт', orders: 8,  revenue: 61000  },
  { day: 'Ср', orders: 6,  revenue: 55000  },
  { day: 'Чт', orders: 11, revenue: 78000  },
  { day: 'Пт', orders: 9,  revenue: 69000  },
  { day: 'Сб', orders: 14, revenue: 91000  },
  { day: 'Вс', orders: 12, revenue: 84500  },
]

// ── Stock movements ───────────────────────────────────────────────────────────
export type MovementType = 'IN' | 'OUT' | 'RESERVE' | 'PRODUCE'

export interface StockMovement {
  id: string
  type: MovementType
  material: string
  qty: string
  unit: string
  reason: string
  time: string          // relative label
  actor: string
}

export const RECENT_MOVEMENTS: StockMovement[] = [
  { id: 'm1', type: 'IN',      material: 'Ткань хлопок',  qty: '+50',  unit: 'кг',  reason: 'Приход от поставщика',      time: '2 мин',  actor: 'И.Беляев'    },
  { id: 'm2', type: 'RESERVE', material: 'Нитки белые',   qty: '-3',   unit: 'кг',  reason: 'Резерв под заказ #0047',    time: '15 мин', actor: 'Д.Соколова'  },
  { id: 'm3', type: 'OUT',     material: 'Пуговицы',      qty: '-120', unit: 'шт',  reason: 'Пошив партии #003',         time: '1 ч',    actor: 'И.Беляев'    },
  { id: 'm4', type: 'PRODUCE', material: 'Футболка M',    qty: '+80',  unit: 'шт',  reason: 'Готовая продукция',         time: '3 ч',    actor: 'Цех'         },
  { id: 'm5', type: 'IN',      material: 'Ткань лён',     qty: '+30',  unit: 'кг',  reason: 'Приход от поставщика',      time: '5 ч',    actor: 'И.Беляев'    },
  { id: 'm6', type: 'OUT',     material: 'Нитки чёрные',  qty: '-5',   unit: 'кг',  reason: 'Пошив партии #002',         time: '6 ч',    actor: 'Цех'         },
]

// ── Active orders ─────────────────────────────────────────────────────────────
export type OrderStatus = 'NEW' | 'IN_WORK' | 'DONE' | 'CANCELED'

export interface Order {
  id: string
  num: string
  client: string
  items: string
  total: string
  status: OrderStatus
  date: string
}

export const ACTIVE_ORDERS: Order[] = [
  { id: 'o1', num: '#0047', client: 'ИП Иванова А.С.',    items: '50 шт футб.',  total: '37 500 UZS', status: 'IN_WORK',  date: 'сегодня'  },
  { id: 'o2', num: '#0048', client: 'Школа №142',          items: '120 шт.',      total: '84 000 UZS', status: 'NEW',      date: 'сегодня'  },
  { id: 'o3', num: '#0046', client: 'ООО "Спорт-Юг"',     items: '30 шт худи.',  total: '45 000 UZS', status: 'IN_WORK',  date: 'вчера'    },
  { id: 'o4', num: '#0045', client: 'Кирилл Петров',       items: '5 шт поло.',   total: '7 500 UZS',  status: 'DONE',     date: 'вчера'    },
]

// ── Quick actions ─────────────────────────────────────────────────────────────
export interface QuickAction {
  id: string
  label: string
  icon: string      // phosphor icon name
  color: string     // tailwind bg classes
  roles: UserRole[]
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'new-order',    label: 'Новый заказ',   icon: 'Plus',          color: 'bg-brand-600 hover:bg-brand-500',     roles: ['ADMIN', 'MANAGER']   },
  { id: 'new-receipt',  label: 'Приход сырья',  icon: 'Package',       color: 'bg-emerald-600 hover:bg-emerald-500', roles: ['ADMIN', 'WAREHOUSE'] },
  { id: 'new-produce',  label: 'Задание цеху',  icon: 'Scissors',      color: 'bg-amber-600 hover:bg-amber-500',     roles: ['ADMIN', 'WAREHOUSE'] },
  { id: 'kanban',       label: 'Канбан',         icon: 'Columns',       color: 'bg-purple-600 hover:bg-purple-500',  roles: ['ADMIN', 'MANAGER']   },
  { id: 'reports',      label: 'Отчёты',         icon: 'ChartBar',      color: 'bg-rose-600 hover:bg-rose-500',       roles: ['ADMIN']              },
  { id: 'clients',      label: 'Клиенты',        icon: 'Users',         color: 'bg-sky-600 hover:bg-sky-500',         roles: ['ADMIN', 'MANAGER']   },
]
