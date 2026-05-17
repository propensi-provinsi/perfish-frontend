"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { batchDetailQrValue } from "@/lib/batch-detail-url";

export default function BatchQrCode({
  batchNumber,
  size = 48,
}: {
  batchNumber: string;
  size?: number;
}) {
  const [value, setValue] = useState(batchNumber);

  useEffect(() => {
    setValue(batchDetailQrValue(batchNumber));
  }, [batchNumber]);

  return <QRCodeSVG value={value} size={size} level="M" />;
}
