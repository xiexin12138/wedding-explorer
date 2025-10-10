'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { NavigationButton } from "@/components/NavigationButton";
import { SPECIAL_ROUTES } from "@/lib/routes.config";

export default function LeaderboardCard() {
  const [minCoinThreshold, setMinCoinThreshold] = useState<number | null>(null);

  // 获取上榜门槛配置
  useEffect(() => {
    const fetchMinCoinThreshold = async () => {
      try {
        const response = await fetch('/api/admin/settings/dictionary/key/LEADERBOARD_MIN_COIN_THRESHOLD');
        if (response.ok) {
          const result = await response.json();
          if (result.value) {
            setMinCoinThreshold(parseInt(result.value, 10));
          }
        }
      } catch (error) {
        console.error('Failed to fetch min coin threshold:', error);
      }
    };

    fetchMinCoinThreshold();
  }, []);

  return (
    <Card className="relative overflow-hidden border-orange-300/50 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-orange-950/20">
      {/* 排行榜背景装饰 */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-4 right-4 text-orange-400 text-7xl">🏆</div>
        <div className="absolute bottom-6 left-6 text-amber-400 text-6xl">🥇</div>
        <div className="absolute top-1/3 left-1/3 text-orange-400 text-5xl">🏅</div>
      </div>
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-orange-900 dark:text-orange-100">
          <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          游戏币排行榜
        </CardTitle>
        <CardDescription className="text-orange-800/80 dark:text-orange-200/70">
          {minCoinThreshold 
            ? `拥有 ${minCoinThreshold} 个金币以上即可上榜，查看谁是最富有的玩家`
            : '查看当前游戏币排行榜，看看谁是最富有的玩家'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <NavigationButton 
          href={SPECIAL_ROUTES.LEADERBOARD}
          variant="outline" 
          className="w-full border-orange-400/50 bg-orange-100/50 hover:bg-orange-200/70 text-orange-900 hover:text-orange-950 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-100 dark:border-orange-600/50"
        >
          查看排行榜
        </NavigationButton>
      </CardContent>
    </Card>
  );
}
