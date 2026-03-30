"use client";

import { CommessaDetailView } from "./commessa-detail-view";
import { useParams } from "next/navigation";

export default function CommessaDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  return <CommessaDetailView id={id} />;
}
