"use client";

import { useEffect, useState } from "react";

const WEDDING_DATE = new Date("2025-10-25T00:00:00");

export function WeddingCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = WEDDING_DATE.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft("婚礼已经开始啦！🎉");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`);
    };

    // 初始计算
    calculateTimeLeft();

    // 每秒更新一次
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center space-y-2">
      <div className="text-lg font-medium text-muted-foreground">
        距离婚礼还有
      </div>
      <div className="text-2xl font-bold text-primary">
        {timeLeft}
      </div>
    </div>
  );
}