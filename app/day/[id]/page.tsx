import { notFound } from "next/navigation";
import { DayView } from "@/components/day/DayView";
import { TOTAL_DAYS } from "@/lib/curriculum";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DayPage({ params }: PageProps) {
  const { id } = await params;
  const day = parseInt(id, 10);
  if (isNaN(day) || day < 1 || day > TOTAL_DAYS) {
    notFound();
  }
  return <DayView day={day} />;
}
