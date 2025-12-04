/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth-server";

// GET /api/customers?phone=...&name=...&page=1&pageSize=20
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") ?? undefined;
  const name = searchParams.get("name") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");

  const where: any = {};
  if (phone) {
    where.phone = { contains: phone };
  }
  if (name) {
    where.fullName = { contains: name, mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        defaultAddress: true,
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

// POST /api/customers  (create or quick-create for phone orders)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const {
    id,
    fullName,
    phone,
    email,
    imageUrl,
    notes,
    address,
  }: {
    id?: string;
    fullName: string;
    phone: string;
    email?: string;
    imageUrl?: string;
    notes?: string;
    address?: {
      id?: string;
      label: string;
      street: string;
      city: string;
      state: string;
      zip: string;
      extraDirections?: string;
      isDefault?: boolean;
    };
  } = body;

  if (!fullName || !phone) {
    return NextResponse.json(
      { error: "fullName and phone are required" },
      { status: 400 },
    );
  }

  const normalizedPhone = phone.replace(/\D/g, "");

  if (id) {
    // Update existing customer
    const updated = await prisma.customer.update({
      where: { id },
      data: {
        fullName,
        phone: normalizedPhone,
        email,
        notes,
      },
      include: { defaultAddress: true },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.customer.create({
    data: {
      fullName,
      phone: normalizedPhone,
      email: email || undefined,
      imageUrl: imageUrl || undefined,
      notes: notes || undefined,
      addresses: address
        ? {
            create: {
              label: address.label,
              street: address.street,
              city: address.city,
              state: address.state,
              zip: address.zip,
              extraDirections: address.extraDirections,
              isDefault: address.isDefault ?? true,
            },
          }
        : undefined,
    },
    include: { defaultAddress: true },
  });

  return NextResponse.json(created, { status: 201 });
}


