import type { Metadata } from "next";
import BrokersBrowse from "@/components/BrokersBrowse";
import { BROKER_CATEGORY_DESCRIPTIONS, BROKER_CATEGORY_LABELS } from "@/lib/broker-types";

export const metadata: Metadata = {
  title: BROKER_CATEGORY_LABELS.crypto,
  description: BROKER_CATEGORY_DESCRIPTIONS.crypto,
};

export default function CryptoExchangesPage() {
  return <BrokersBrowse category="crypto" />;
}