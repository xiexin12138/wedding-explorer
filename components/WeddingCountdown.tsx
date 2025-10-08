"use client";

import { useEffect, useState } from "react";

export function WeddingCountdown() {
  const [timeLeft, setTimeLeft] = useState("- 天 - 小时 - 分钟 - 秒");
  const [weddingDate, setWeddingDate] = useState<Date | null>(null);  

  // 开始日期直接硬编码为 2025-10-25 06:00
  useEffect(() => {
    setWeddingDate(new Date("2025-10-25 06:00"));
  }, []);

  // 计算倒计时的定时器
  useEffect(() => {
    if (!weddingDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = weddingDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft("活动已经开始啦！🎉");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`);
    };

    // 初始计算
    calculateTimeLeft();

    // 每秒更新一次
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [weddingDate]);

  return (
    <div className="text-center space-y-2">
      <div className="text-lg font-medium text-muted-foreground">
        距离活动还有
      </div>
      <div className="text-2xl font-bold text-primary">{timeLeft}</div>
    </div>
  );
}
