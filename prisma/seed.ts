import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create menu categories
  const pizzaCategory = await prisma.menuCategory.upsert({
    where: { id: "cat-pizza" },
    update: {},
    create: {
      id: "cat-pizza",
      name: "Pizza",
      sortOrder: 1,
    },
  });

  const sidesCategory = await prisma.menuCategory.upsert({
    where: { id: "cat-sides" },
    update: {},
    create: {
      id: "cat-sides",
      name: "Sides",
      sortOrder: 2,
    },
  });

  const drinksCategory = await prisma.menuCategory.upsert({
    where: { id: "cat-drinks" },
    update: {},
    create: {
      id: "cat-drinks",
      name: "Drinks",
      sortOrder: 3,
    },
  });

  // Create pizza items
  const pizzas = [
    {
      id: "item-cheese",
      name: "Cheese Pizza",
      description: "Classic cheese pizza with mozzarella",
      basePrice: 12.99,
      categoryId: pizzaCategory.id,
      sku: "PIZ-001",
    },
    {
      id: "item-pepperoni",
      name: "Pepperoni Pizza",
      description: "Pepperoni and mozzarella",
      basePrice: 14.99,
      categoryId: pizzaCategory.id,
      sku: "PIZ-002",
    },
    {
      id: "item-margherita",
      name: "Margherita",
      description: "Fresh mozzarella, basil, and tomato",
      basePrice: 15.99,
      categoryId: pizzaCategory.id,
      sku: "PIZ-003",
    },
    {
      id: "item-veggie",
      name: "Veggie Delight",
      description: "Bell peppers, mushrooms, onions, olives",
      basePrice: 16.99,
      categoryId: pizzaCategory.id,
      sku: "PIZ-004",
    },
    {
      id: "item-meat-lovers",
      name: "Meat Lovers",
      description: "Pepperoni, sausage, ham, bacon",
      basePrice: 18.99,
      categoryId: pizzaCategory.id,
      sku: "PIZ-005",
    },
  ];

  for (const pizza of pizzas) {
    await prisma.menuItem.upsert({
      where: { id: pizza.id },
      update: {},
      create: pizza,
    });
  }

  // Create sides
  const sides = [
    {
      id: "item-garlic-bread",
      name: "Garlic Bread",
      description: "6 pieces of garlic bread",
      basePrice: 4.99,
      categoryId: sidesCategory.id,
      sku: "SIDE-001",
    },
    {
      id: "item-wings",
      name: "Chicken Wings",
      description: "8 pieces, your choice of sauce",
      basePrice: 9.99,
      categoryId: sidesCategory.id,
      sku: "SIDE-002",
    },
    {
      id: "item-salad",
      name: "Caesar Salad",
      description: "Fresh romaine, caesar dressing, croutons",
      basePrice: 7.99,
      categoryId: sidesCategory.id,
      sku: "SIDE-003",
    },
  ];

  for (const side of sides) {
    await prisma.menuItem.upsert({
      where: { id: side.id },
      update: {},
      create: side,
    });
  }

  // Create drinks
  const drinks = [
    {
      id: "item-coke",
      name: "Coca-Cola",
      description: "20oz bottle",
      basePrice: 2.99,
      categoryId: drinksCategory.id,
      sku: "DRINK-001",
    },
    {
      id: "item-pepsi",
      name: "Pepsi",
      description: "20oz bottle",
      basePrice: 2.99,
      categoryId: drinksCategory.id,
      sku: "DRINK-002",
    },
    {
      id: "item-sprite",
      name: "Sprite",
      description: "20oz bottle",
      basePrice: 2.99,
      categoryId: drinksCategory.id,
      sku: "DRINK-003",
    },
    {
      id: "item-water",
      name: "Water",
      description: "Bottled water",
      basePrice: 1.99,
      categoryId: drinksCategory.id,
      sku: "DRINK-004",
    },
  ];

  for (const drink of drinks) {
    await prisma.menuItem.upsert({
      where: { id: drink.id },
      update: {},
      create: drink,
    });
  }

  // Create sample customers
  const customers = [
    {
      id: "cust-001",
      fullName: "John Smith",
      phone: "9292628021",
      email: "john.smith@example.com",
      notes: "Regular customer, prefers pepperoni pizza",
    },
    {
      id: "cust-002",
      fullName: "Maria Garcia",
      phone: "5551234567",
      email: "maria.garcia@example.com",
      notes: "Likes extra cheese, delivery preferred",
    },
    {
      id: "cust-003",
      fullName: "David Johnson",
      phone: "5559876543",
      email: "david.j@example.com",
      notes: "Vegetarian options only",
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {},
      create: {
        ...customer,
        addresses: {
          create: {
            label: "Home",
            street: "123 Main St",
            city: "Your City",
            state: "ST",
            zip: "12345",
            isDefault: true,
          },
        },
      },
    });
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

