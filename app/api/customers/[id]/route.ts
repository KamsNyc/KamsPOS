import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth-server";

type Params = {
  params: Promise<{ id: string }>;
};

// GET /api/customers/:id
export async function GET(_request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
      defaultAddress: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Calculate customer statistics
  const orderStats = await prisma.order.aggregate({
    where: { customerId: id },
    _count: { id: true },
    _sum: { total: true },
    _max: { createdAt: true },
  });

  const stats = {
    orderCount: orderStats._count.id || 0,
    totalSpent: orderStats._sum.total ? Number(orderStats._sum.total) : 0,
    lastOrderDate: orderStats._max.createdAt || null,
  };

  return NextResponse.json({ ...customer, ...stats });
}

// PATCH /api/customers/:id  (update customer and addresses)
export async function PATCH(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();

  const {
    fullName,
    phone,
    email,
    notes,
    addresses,
  }: {
    fullName?: string;
    phone?: string;
    email?: string;
    notes?: string;
    addresses?: Array<{
      id?: string;
      label: string;
      street: string;
      city: string;
      state: string;
      zip: string;
      extraDirections?: string;
      isDefault?: boolean;
    }>;
  } = body;

  const normalizedPhone = phone ? phone.replace(/\D/g, "") : undefined;

  // Find the default address ID if addresses are provided
  if (addresses && addresses.length > 0) {
    const defaultAddr = addresses.find((addr: { id?: string; isDefault?: boolean }) => addr.isDefault);
    if (defaultAddr) {
      // If it's a new address (no id), we'll need to find it after creation
      // For now, we'll handle it after the update
    }
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      fullName,
      phone: normalizedPhone,
      email,
      notes,
      ...(addresses
        ? {
            addresses: {
              deleteMany: {},
              create: addresses.map((addr: { label: string; street: string; city: string; state: string; zip: string; extraDirections?: string; isDefault?: boolean }) => ({
                label: addr.label,
                street: addr.street,
                city: addr.city,
                state: addr.state,
                zip: addr.zip,
                extraDirections: addr.extraDirections,
                isDefault: addr.isDefault ?? false,
              })),
            },
          }
        : {}),
    },
    include: {
      addresses: true,
      defaultAddress: true,
    },
  });

  // Update defaultAddressId if needed
  if (addresses && addresses.length > 0) {
    const defaultAddr = updated.addresses.find((addr: { id: string; isDefault: boolean }) => addr.isDefault);
    if (defaultAddr) {
      await prisma.customer.update({
        where: { id },
        data: { defaultAddressId: defaultAddr.id },
      });
      // Refetch to get updated defaultAddress
      const refreshed = await prisma.customer.findUnique({
        where: { id },
        include: {
          addresses: true,
          defaultAddress: true,
        },
      });
      if (refreshed) {
        Object.assign(updated, refreshed);
      }
    } else if (updated.defaultAddressId) {
      // Clear defaultAddressId if no address is marked as default
      await prisma.customer.update({
        where: { id },
        data: { defaultAddressId: null },
      });
      updated.defaultAddressId = null;
      updated.defaultAddress = null;
    }
  }

  // Recalculate stats after update
  const orderStats = await prisma.order.aggregate({
    where: { customerId: id },
    _count: { id: true },
    _sum: { total: true },
    _max: { createdAt: true },
  });

  const stats = {
    orderCount: orderStats._count.id || 0,
    totalSpent: orderStats._sum.total ? Number(orderStats._sum.total) : 0,
    lastOrderDate: orderStats._max.createdAt || null,
  };

  return NextResponse.json({ ...updated, ...stats });
}


