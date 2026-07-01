import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Users
  const adminPwd = await bcrypt.hash('admin123', 12);
  const managerPwd = await bcrypt.hash('manager123', 12);
  const skladPwd = await bcrypt.hash('sklad123', 12);

  await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: { login: 'admin', password: adminPwd, name: 'Администратор', role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { login: 'manager' },
    update: {},
    create: { login: 'manager', password: managerPwd, name: 'Менеджер', role: 'MANAGER' },
  });
  await prisma.user.upsert({
    where: { login: 'sklad' },
    update: {},
    create: { login: 'sklad', password: skladPwd, name: 'Складовщик', role: 'WAREHOUSE' },
  });

  // Order Sources
  const sourceNames = ['BOF', 'Futbolka.uz', 'Сайт', 'Рекомендация', 'Другое'];
  for (const name of sourceNames) {
    const existing = await prisma.orderSource.findFirst({ where: { name } });
    if (!existing) {
      await prisma.orderSource.create({ data: { name } });
    }
  }

  // Products
  const products = [
    { name: 'Футболка BOF Classic', article: 'FBZ-M-WHT', size: 'M', color: 'Белый', colorHex: '#FFFFFF', description: 'Классическая футболка' },
    { name: 'Футболка BOF Classic', article: 'FBZ-L-BLK', size: 'L', color: 'Чёрный', colorHex: '#1a1a1a', description: 'Классическая футболка' },
    { name: 'Футболка BOF Sport', article: 'FBS-M-GRY', size: 'M', color: 'Серый', colorHex: '#9ca3af', description: 'Спортивная футболка' },
    { name: 'Поло BOF Premium', article: 'PLO-L-NVY', size: 'L', color: 'Тёмно-синий', colorHex: '#1e3a5f', description: 'Поло премиум класса' },
    { name: 'Худи BOF Oversize', article: 'HDO-XL-BLK', size: 'XL', color: 'Чёрный', colorHex: '#1a1a1a', description: 'Оверсайз худи' },
    { name: 'Футболка BOF Kids', article: 'FBK-S-RED', size: 'S', color: 'Красный', colorHex: '#ef4444', description: 'Детская футболка' },
  ];

  const stockQty = [50, 30, 45, 20, 15, 60];
  for (let i = 0; i < products.length; i++) {
    const prod = await prisma.product.create({ data: products[i] });
    await prisma.productMovement.create({
      data: {
        productId: prod.id,
        type: 'IN',
        qty: stockQty[i],
        comment: 'Начальный остаток',
        actorName: 'Система',
      },
    });
  }

  // Materials
  const materials = [
    { name: 'Хлопок 180г/м²', unit: 'кг', description: 'Основная ткань' },
    { name: 'Полиэстер 150г/м²', unit: 'кг', description: 'Синтетическая ткань' },
    { name: 'Нитки белые №40', unit: 'катушка', description: 'Швейные нитки' },
    { name: 'Нитки чёрные №40', unit: 'катушка', description: 'Швейные нитки' },
    { name: 'Этикетки BOF', unit: 'шт', description: 'Фирменные этикетки' },
    { name: 'Упаковочные пакеты', unit: 'шт', description: 'Пакеты для упаковки' },
    { name: 'Резинка для пояса', unit: 'м', description: 'Резинка 3см' },
  ];

  for (const m of materials) {
    const mat = await prisma.material.create({ data: m });
    await prisma.materialMovement.create({
      data: {
        materialId: mat.id,
        type: 'IN',
        qty: 100,
        comment: 'Начальный остаток',
        actorName: 'Система',
      },
    });
  }

  console.log('Seed completed!');
  console.log('Users: admin/admin123, manager/manager123, sklad/sklad123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
