import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import type {
  OrderType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { auth } from "@/app/lib/auth-server";

// POST /api/orders - create order with items
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const {
    customerId,
    type,
    status,
    subtotal,
    tax,
    deliveryFee,
    discountTotal,
    total,
    paymentMethod,
    paymentStatus,
    deliveryAddressId,
    notes,
    items,
    placedByUserId, // Optional - defaults to authenticated user
  }: {
    customerId?: string;
    type: OrderType;
    status?: OrderStatus;
    subtotal: string;
    tax: string;
    deliveryFee?: string;
    discountTotal?: string;
    total: string;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    deliveryAddressId?: string;
    notes?: string;
    placedByUserId?: string; 
    items: Array<{
      menuItemId: string;
      nameSnapshot: string;
      unitPriceSnapshot: string;
      quantity: number;
      lineTotal: string;
      specialInstructions?: string;
      modifiers?: Array<{
        modifierId: string;
        nameSnapshot: string;
        priceSnapshot: string;
      }>;
    }>;
  } = body;

  if (!type || !subtotal || !tax || !total || !items?.length) {
    return NextResponse.json(
      { error: "Missing required order fields" },
      { status: 400 },
    );
  }

  // Use authenticated user ID if not provided
  const finalPlacedByUserId = placedByUserId || userId;

  const nextOrderNumberRecord = await prisma.order.aggregate({
    _max: { orderNumber: true },
  });
  const nextOrderNumber = (nextOrderNumberRecord._max.orderNumber ?? 0) + 1;

  // Generate random 4-digit order number (1000-9999) - fast, no extra DB query
  const dailySequence = Math.floor(1000 + Math.random() * 9000);

  const order = await prisma.order.create({
    data: {
      orderNumber: nextOrderNumber,
      dailySequence,
      customerId,
      type,
      status: status ?? "NEW",
      subtotal,
      tax,
      deliveryFee: deliveryFee ?? "0",
      discountTotal: discountTotal ?? "0",
      total,
      paymentMethod,
      paymentStatus: paymentStatus ?? "PAID",
      placedByUserId: finalPlacedByUserId,
      deliveryAddressId,
      notes,
      items: {
        create: items.map((item) => ({
            menuItemId: item.menuItemId,
            nameSnapshot: item.nameSnapshot,
            unitPriceSnapshot: item.unitPriceSnapshot,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            specialInstructions: item.specialInstructions,
            modifiers: {
                create: item.modifiers?.map((mod) => ({
                    modifierId: mod.modifierId,
                    nameSnapshot: mod.nameSnapshot,
                    priceSnapshot: mod.priceSnapshot
                }))
            }
        })),
      },
    },
    include: {
      items: {
        include: {
            modifiers: true
        }
      },
    },
  });

  return NextResponse.json(order, { status: 201 });
}

// GET /api/orders?status=...&type=...&from=...&to=...&page=1&pageSize=20
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as OrderStatus | null;
  const type = searchParams.get("type") as OrderType | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");

  const where: {
    status?: OrderStatus;
    type?: OrderType;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (status) where.status = status;
  if (type) where.type = type;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}


