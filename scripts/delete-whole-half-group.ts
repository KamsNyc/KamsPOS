import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteWholeHalfGroup() {
  try {
    // Find modifier groups with "whole" or "half" in the name (case insensitive)
    const groups = await prisma.modifierGroup.findMany({
      where: {
        OR: [
          { name: { contains: "Whole", mode: "insensitive" } },
          { name: { contains: "Half", mode: "insensitive" } },
          { name: { contains: "whole/half", mode: "insensitive" } },
          { name: { contains: "whole-half", mode: "insensitive" } },
        ],
      },
      include: {
        modifiers: true,
        menuItems: true,
      },
    });

    if (groups.length === 0) {
      console.log("No Whole/Half modifier groups found.");
      return;
    }

    console.log(`Found ${groups.length} modifier group(s) to delete:`);
    groups.forEach((group) => {
      console.log(`- ${group.name} (ID: ${group.id})`);
      console.log(`  Modifiers: ${group.modifiers.length}`);
      console.log(`  Attached to ${group.menuItems.length} menu item(s)`);
    });

    // Delete each group (cascade will delete modifiers and menu item associations)
    for (const group of groups) {
      await prisma.modifierGroup.delete({
        where: { id: group.id },
      });
      console.log(`✓ Deleted "${group.name}"`);
    }

    console.log("\n✅ All Whole/Half modifier groups deleted successfully!");
  } catch (error) {
    console.error("Error deleting Whole/Half groups:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteWholeHalfGroup();

